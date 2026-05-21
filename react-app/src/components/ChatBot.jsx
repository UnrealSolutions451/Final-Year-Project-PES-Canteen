import { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "llama-3.1-8b-instant";

// Browser capability detection
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const HAS_STT = !!SpeechRecognitionAPI;
const HAS_TTS = !!window.speechSynthesis;

function normalize(v) { return (v ?? "").toString().trim().toLowerCase(); }

// ── System prompt ──────────────────────────────────────────
function buildSystemPrompt(menuItems) {
  const available = menuItems.filter(i => i.available === true);
  const byCategory = {};
  available.forEach(item => {
    const cat = item.category || item.ty || "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(
      `• ${item.name} — ₹${item.price}${item.ty ? ` (${item.ty})` : ""}${item.description ? " — " + item.description : ""}`
    );
  });
  const menuText = Object.entries(byCategory)
    .map(([cat, items]) => `${cat}:\n${items.join("\n")}`)
    .join("\n\n");

  return `You are "BiteBuddy" 🍔, the friendly AI food assistant at P.E.S. Canteen.
Your personality: warm, fun, casual — like a foodie friend helping a buddy decide what to eat.

RULES:
- Keep every reply SHORT — max 3-4 sentences. Use emojis occasionally.
- NEVER wrap your reply in double quotes. Respond naturally, no quotation marks.
- Only recommend items currently available (listed below). Never make up items.
- If asked for something not on the menu, say it's not available and suggest the closest alternative.
- Understand preferences: high protein, low calorie, vegetarian, vegan, spicy, light, budget-friendly, filling, quick snack, healthy, comfort food.
- If user seems indecisive, ask ONE fun question to narrow it down.
- Always mention the price when recommending an item.
- If asked something unrelated to food, politely steer back.
- If the user gives two or more choices (e.g. "should I get X or Y?", "X or Y?"), confidently pick ONE and briefly say why.
- If the user picks or names one of your suggestions, confirm it enthusiastically and say one great thing about it.
- Always respond in English or Hinglish. Hinglish means Hindi words written in English/Roman letters (e.g. "Bhai sahi choice hai!", "Yaar ekdum mast option hai!", "Kya loge aaj?"). NEVER use Devanagari (Hindi script). Keep prices in ₹.
- CART RULES — choose based on how clearly the user wants to order:
  • DIRECT ORDER (user explicitly says add/order/get/give/dena/chahiye + item name, e.g. "add 2 samosas", "order a coffee", "ek sandwich dena"): respond warmly AND append at the very end: [ADD:ExactItemName:Quantity]
  • IMPLIED INTEREST (user says they like something or will take it but didn't explicitly say add/order, e.g. "I'll take the samosa", "that sounds good", "the paneer wrap looks nice"): respond and ask "Want me to add it to your cart? 🛒" AND append at the very end: [CONFIRM:ExactItemName:Quantity]
  • Use the EXACT item name from the menu. If quantity not mentioned, use 1.

TODAY'S AVAILABLE MENU:
${menuText || "Menu is loading..."}`;
}

// ── Rule-based fallback ────────────────────────────────────
function ruleBasedReply(text, menuItems) {
  const q    = normalize(text);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const available = menuItems.filter(i => i.available === true);

  // ── Greetings ──────────────────────────────────────────
  if (/^(hi+|hello+|hey+|helo+|hii+|namaste|hola|sup|wassup|yo\b|heya|howdy|good\s*(morning|afternoon|evening))/.test(q)) {
    return pick([
      "Hey! 👋 I'm BiteBuddy — your canteen food guide! What are you in the mood for today? 😄",
      "Hello there! 😊 Ready to find you something yummy! Veg, non-veg, or something light?",
      "Hey hey! 🍽️ BiteBuddy here! What's the vibe today — proper hungry or just snacky?",
      "Hi! Welcome to P.E.S. Canteen 🎉 Tell me what you're craving and I'll sort you out!",
      "Namaste! 🙏 Kya loge aaj? Tell me your mood and I'll find the perfect match!",
      "Yo! 😄 What are we eating today? I know every item on the menu — just ask!",
    ]);
  }

  // ── Thank you ──────────────────────────────────────────
  if (/\b(thank(s| you)?|shukriya|dhanyawad|ty\b|thx|appreciate)\b/.test(q)) {
    return pick([
      "You're welcome! 😊 Enjoy your meal! Let me know if you need anything else.",
      "Anytime! 🍽️ Hope you enjoy it — come back if you need more recs!",
      "Happy to help! 😄 Bon appétit!",
      "My pleasure! 🙌 Enjoy your food, yaar!",
      "Koi baat nahi! 😄 Enjoy your meal!",
    ]);
  }

  // ── Farewell ───────────────────────────────────────────
  if (/\b(bye|goodbye|see\s*ya|cya|alvida|later|take\s*care|baad\s*mein)\b/.test(q)) {
    return pick([
      "Bye! 👋 Come back hungry! 😄",
      "See you! 🍽️ Hope you enjoyed your meal at P.E.S. Canteen!",
      "Later! 😊 Come back soon, yaar!",
      "Alvida! 👋 It was great helping you today!",
    ]);
  }

  // ── How are you ────────────────────────────────────────
  if (/\b(how are you|kya haal|what'?s up|kaisa hai|all good|you okay)\b/.test(q)) {
    return pick([
      "Doing great, thanks! 😄 More importantly — what are YOU eating today? 🍽️",
      "I'm always in food mode 🍔 What are you craving?",
      "Ekdum mast! 🎉 Ready to help you find the best bite today. What's the plan?",
      "Never better! 😄 Now tell me — hungry or just snacky?",
    ]);
  }

  // ── Who are you / what can you do ─────────────────────
  if (/\b(who are you|what are you|your name|introduce|what can you|bitebuddy|help me|help)\b/.test(q)) {
    return "I'm BiteBuddy 🍔 — your AI food guide at P.E.S. Canteen! I can recommend dishes, filter veg/non-veg, find budget meals, suggest healthy options, and even add items to your cart. Just ask! 😄";
  }

  // ── Show menu / what's available ──────────────────────
  if (/\b(menu|what.*available|kya hai aaj|show.*item|full list|today.*special|kya kya hai)\b/.test(q)) {
    if (available.length === 0) return "Menu is being updated right now! Check back in a bit 😊";
    const sample = available.slice(0, 4).map(i => `${i.name} (₹${i.price})`).join(", ");
    return pick([
      `Today we have ${available.length} items! Highlights: ${sample} and more. What sounds good? 😄`,
      `${available.length} items are available today! Like ${sample}... What are you in the mood for? 🍽️`,
    ]);
  }

  // ── Price / how much ───────────────────────────────────
  if (/\b(price|cost|kitna|how much|rate|expensive|range)\b/.test(q)) {
    if (available.length === 0) return "Menu is loading! Try again in a sec 😊";
    const sorted   = [...available].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    const cheapest = sorted[0];
    const priciest = sorted[sorted.length - 1];
    return `Prices range from ₹${cheapest.price} (${cheapest.name}) up to ₹${priciest.price} (${priciest.name}). What's your budget? 💰`;
  }

  // ── Positive feedback ──────────────────────────────────
  if (/^(good|nice|cool|awesome|great|amazing|superb|perfect|loved?\s*it|delicious|tasty|yummy|mast\b)/.test(q)) {
    return pick([
      "Glad you liked it! 😄 Come back anytime for more recs!",
      "Awesome! 🎉 Good food = good mood! Let me know if you want anything else.",
      "Yaar sahi bola! 😄 Enjoy your meal!",
    ]);
  }

  // ── No menu items available guard ─────────────────────
  if (available.length === 0)
    return "Hmm, the menu seems empty right now 😅 Please check back in a bit!";

  // ── Food preference filtering ──────────────────────────
  let items = [...available];

  const wantsVeg    = /\bveg(etarian)?\b/.test(q) && !/non.?veg/.test(q);
  const wantsNonVeg = /\b(non.?veg|chicken|meat|egg)\b/.test(q);
  if (wantsVeg)    items = items.filter(i => normalize(i.ty) === "veg");
  if (wantsNonVeg) items = items.filter(i => normalize(i.ty) === "non-veg");

  if      (/\b(drink|juice|water|beverage|chai|coffee|tea)\b/.test(q))
    items = items.filter(i => normalize(i.category) === "drinks" || normalize(i.ty) === "drinks");
  else if (/\bsnack\b/.test(q))
    items = items.filter(i => normalize(i.category) === "snacks");
  else if (/\bchinese\b/.test(q))
    items = items.filter(i => normalize(i.category) === "chinese");

  const wantsBudget  = /\b(cheap|budget|afford|low.?cost|inexpensive|sasta|kam\s*daam)\b/.test(q);
  const wantsFilling = /\b(fill|protein|heavy|hungry|hearty|bhari|bhook)\b/.test(q);
  const wantsHealthy = /\b(healthy|light|diet|low.?cal|nutritious|fit)\b/.test(q);

  if (wantsBudget)  items = [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  if (wantsFilling) items = [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

  // Fallback to full list if filters wiped everything
  if (items.length === 0) items = available;

  const picks = items.slice(0, 3);
  const list  = picks.map(p => `${p.name} (₹${p.price})`).join(", ");

  if (wantsBudget)  return pick([
    `Best budget picks today: ${list} 💰 Easy on the wallet!`,
    `Sasta aur mast! Check these out: ${list} 💰`,
    `These won't burn a hole in your pocket: ${list} 💰 Great value!`,
  ]);
  if (wantsHealthy) return pick([
    `Healthy options I'd suggest: ${list} 🥗 Light and nutritious!`,
    `Eating clean today? Try: ${list} 🥗 Good choices yaar!`,
    `These are your best healthy bets: ${list} 🥗`,
  ]);
  if (wantsFilling) return pick([
    `These'll keep you full: ${list} 💪 Proper hearty meals!`,
    `Hungry? These are the most filling: ${list} 💪 Zero chance of hunger after this!`,
    `Bhari bhari meal chahiye? Try: ${list} 💪 You won't need snacks after this!`,
  ]);
  if (wantsVeg)     return pick([
    `Top veg picks today: ${list} 🌿 Fresh and tasty!`,
    `Pure veg and totally worth it: ${list} 🌿`,
    `Veg lovers, these are for you: ${list} 🌿 Ekdum fresh!`,
  ]);
  if (wantsNonVeg)  return pick([
    `Non-veg options available: ${list} 🍗 Delicious!`,
    `For the non-veg lovers: ${list} 🍗 Proper tasty!`,
    `Maans khana hai? Try these: ${list} 🍗`,
  ]);

  return pick([
    `Here's what I'd suggest today: ${list} 😊 Want me to narrow it down?`,
    `These are solid choices right now: ${list} 😄 Any preference — veg, budget, or filling?`,
    `Ooh try these: ${list} 😋 Or tell me your mood and I'll pick the perfect one!`,
    `Can't go wrong with: ${list} 🍽️ Want something more specific?`,
  ]);
}

// ── Cart helpers ───────────────────────────────────────────
function findMenuItem(name, menuItems) {
  const q = normalize(name);
  return menuItems.find(i => normalize(i.name) === q)
      || menuItems.find(i => normalize(i.name).includes(q) || q.includes(normalize(i.name)));
}

function parseCartActions(text) {
  const actions = [];
  let confirm   = null;
  let cleaned   = text.replace(/\[ADD:([^\]:]+):(\d+)\]/gi, (_, name, qty) => {
    actions.push({ name: name.trim(), qty: Math.max(1, parseInt(qty) || 1) });
    return "";
  });
  cleaned = cleaned.replace(/\[CONFIRM:([^\]:]+):(\d+)\]/gi, (_, name, qty) => {
    confirm = { name: name.trim(), qty: Math.max(1, parseInt(qty) || 1) };
    return "";
  });
  return { cleaned: cleaned.trim(), actions, confirm };
}

function executeCartActions(actions, menuItems, cartKey) {
  if (!actions.length) return [];
  const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
  const added = [];
  actions.forEach(({ name, qty }) => {
    const item = findMenuItem(name, menuItems);
    if (!item) return;
    const idx = cart.findIndex(ci => ci.id === item.id);
    if (idx >= 0) cart[idx].quantity = (cart[idx].quantity || 1) + qty;
    else cart.push({ id: item.id, name: item.name, price: item.price, quantity: qty });
    added.push({ name: item.name, price: item.price, qty });
  });
  if (added.length) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }
  return added;
}

// ── Typing indicator ───────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 14px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: "#0077b6",
          animation: `cbbounce 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function ChatBot({ tableId, sessionId }) {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState([]);
  const [groqHistory, setGroqHistory] = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [menuItems, setMenuItems]     = useState([]);
  const [menuLoaded, setMenuLoaded]   = useState(false);
  const [sysPrompt, setSysPrompt]     = useState("");
  const [pulse, setPulse]             = useState(true);
  const [usingAI, setUsingAI]           = useState(true);
  const [pendingConfirm, setPendingConfirm] = useState(null); // {name, qty}

  // Voice state
  const [listening, setListening]   = useState(false);
  const [speakerOn, setSpeakerOn]   = useState(false);
  const [voiceLang, setVoiceLang]   = useState("en-IN"); // en-IN or hi-IN
  const recognitionRef              = useRef(null);
  const bottomRef                   = useRef(null);
  const inputRef                    = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Load menu on first open
  useEffect(() => {
    if (!open || menuLoaded) return;
    async function loadMenu() {
      try {
        const snap  = await getDocs(collection(db, "menu"));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMenuItems(items);
        setSysPrompt(buildSystemPrompt(items));
      } catch {
        setSysPrompt(buildSystemPrompt([]));
      }
      setMenuLoaded(true);
      setMessages([{
        role: "bot",
        text: "Hey there! 👋 I'm BiteBuddy — your canteen food guide! Not sure what to eat today? Just tell me your vibe and I'll hook you up! 😄",
      }]);
    }
    loadMenu();
  }, [open, menuLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Stop speech when panel closes
  useEffect(() => {
    if (!open && HAS_TTS) window.speechSynthesis.cancel();
  }, [open]);

  // ── TTS ───────────────────────────────────────────────────
  function speak(text) {
    if (!HAS_TTS || !speakerOn) return;
    window.speechSynthesis.cancel();
    // Strip emojis and markdown for cleaner speech
    const clean = text
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/\*+/g, "")
      .trim();
    if (!clean) return;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang  = voiceLang;
    utt.rate  = 0.95;
    utt.pitch = 1.05;
    // Prefer Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const indian = voices.find(v => v.lang === voiceLang) ||
                   voices.find(v => v.lang.startsWith("en-IN") || v.lang.startsWith("hi-IN"));
    if (indian) utt.voice = indian;
    window.speechSynthesis.speak(utt);
  }

  // ── STT ───────────────────────────────────────────────────
  function startListening() {
    if (!HAS_STT || listening || loading) return;
    if (HAS_TTS) window.speechSynthesis.cancel();

    const rec = new SpeechRecognitionAPI();
    rec.lang            = voiceLang;
    rec.continuous      = false;
    rec.interimResults  = true;   // show live transcript while speaking
    rec.maxAlternatives = 1;

    rec.onstart     = () => setListening(true);
    rec.onerror     = () => setListening(false);
    rec.onend       = () => setListening(false);
    // fires the moment the user goes silent — stop immediately
    rec.onspeechend = () => rec.stop();

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText   += e.results[i][0].transcript;
        else                       interimText += e.results[i][0].transcript;
      }
      // Show live interim text in the input box
      setInput(finalText || interimText);
      if (finalText.trim()) {
        setListening(false);
        setTimeout(() => sendWithText(finalText.trim()), 120);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  // ── Core send (accepts explicit text to handle voice) ─────
  async function sendWithText(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: trimmed }]);

    // ── Confirmation flow ──────────────────────────────────
    if (pendingConfirm) {
      const isYes = /\b(yes|yeah|yep|sure|ok|okay|haan|ha|add|go ahead|do it|please|yaar|bhai|please)\b/i.test(trimmed);
      const isNo  = /\b(no|nope|nahi|mat|cancel|don't|dont|leave|nope|skip)\b/i.test(trimmed);
      const cartKey = `cart_${tableId}_${sessionId}`;

      if (isYes) {
        const added = executeCartActions([pendingConfirm], menuItems, cartKey);
        setPendingConfirm(null);
        if (added.length) {
          const summary = added.map(a => `${a.qty}× ${a.name} (₹${a.price * a.qty})`).join(", ");
          setMessages(prev => [...prev,
            { role: "bot",  text: "Done! Added to your cart 🎉 Enjoy your meal!" },
            { role: "cart", text: `🛒 Added to cart: ${summary}` },
          ]);
        }
        speak("Done! Added to your cart. Enjoy your meal!");
        return;
      }
      if (isNo) {
        setPendingConfirm(null);
        setMessages(prev => [...prev,
          { role: "bot", text: "No worries! Let me know if you change your mind 😊" },
        ]);
        speak("No worries! Let me know if you change your mind.");
        return;
      }
      // User said something else — clear pending and answer normally
      setPendingConfirm(null);
    }

    setLoading(true);

    const updatedHistory = [...groqHistory, { role: "user", content: trimmed }];
    let reply = null;

    if (GROQ_KEY && usingAI) {
      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: sysPrompt || buildSystemPrompt(menuItems) },
              ...updatedHistory,
            ],
            max_tokens: 250,
            temperature: 0.85,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let raw = data.choices?.[0]?.message?.content?.trim() || null;
          if (raw) raw = raw.replace(/^["']+|["']+$/g, "").trim();
          reply = raw || null;
        } else if (res.status === 429) {
          setUsingAI(false);
        }
      } catch { /* fall through */ }
    }

    if (!reply) reply = ruleBasedReply(trimmed, menuItems);

    // Parse [ADD:...] / [CONFIRM:...] tags and act on them
    const cartKey = `cart_${tableId}_${sessionId}`;
    const { cleaned, actions, confirm } = parseCartActions(reply);
    const added = executeCartActions(actions, menuItems, cartKey);

    if (confirm) setPendingConfirm(confirm);

    setGroqHistory([...updatedHistory, { role: "assistant", content: cleaned }]);

    const newMsgs = [{ role: "bot", text: cleaned }];
    if (added.length) {
      const summary = added.map(a => `${a.qty}× ${a.name} (₹${a.price * a.qty})`).join(", ");
      newMsgs.push({ role: "cart", text: `🛒 Added to cart: ${summary}` });
    }
    setMessages(prev => [...prev, ...newMsgs]);
    setLoading(false);
    speak(cleaned);
  }

  function sendMessage() { sendWithText(input); }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const CHIPS = ["What's healthy today? 🥗", "Something filling 🍛", "Budget option 💰", "Best veg item 🌿", "High protein 💪"];

  return (
    <>
      <style>{`
        @keyframes cbbounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes cbpulse {
          0%,100% { box-shadow: 0 4px 18px rgba(3,4,94,.45); }
          50% { box-shadow: 0 4px 32px rgba(0,119,182,.85), 0 0 0 10px rgba(0,119,182,.15); }
        }
        @keyframes cbslide {
          from { opacity:0; transform: scale(.85) translateY(12px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes micpulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,.5); }
          60%     { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        }
        .cb-btn {
          position:fixed; bottom:80px; right:18px; z-index:500;
          width:58px; height:58px; border-radius:50%;
          background:linear-gradient(135deg,#03045e,#0077b6);
          border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 18px rgba(3,4,94,.45); font-size:1.5rem; transition:transform .2s;
        }
        .cb-btn:hover { transform:scale(1.1); }
        .cb-btn.pulse { animation:cbpulse 1.8s 3; }
        .cb-panel {
          position:fixed; bottom:148px; right:12px; z-index:499;
          width:min(390px, calc(100vw - 20px));
          background:#f8fafc; border-radius:20px;
          box-shadow:0 12px 48px rgba(3,4,94,.22);
          display:flex; flex-direction:column; overflow:hidden;
          transform-origin:bottom right; animation:cbslide .22s ease-out;
        }
        .cb-header {
          background:linear-gradient(135deg,#03045e,#0077b6);
          color:#fff; padding:12px 14px;
          display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
        }
        .cb-messages {
          flex:1; overflow-y:auto; padding:14px 12px;
          display:flex; flex-direction:column; gap:10px;
          height:320px; scroll-behavior:smooth;
          -webkit-overflow-scrolling:touch;
        }
        .cb-messages::-webkit-scrollbar { width:4px; }
        .cb-messages::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
        .cb-bubble-bot {
          background:#fff; color:#1e293b; border-radius:18px 18px 18px 4px;
          padding:10px 14px; font-size:.92rem; line-height:1.5;
          box-shadow:0 2px 8px rgba(0,0,0,.07); max-width:88%; align-self:flex-start;
          word-break:break-word;
        }
        .cb-bubble-user {
          background:linear-gradient(135deg,#03045e,#0077b6); color:#fff;
          border-radius:18px 18px 4px 18px;
          padding:10px 14px; font-size:.92rem; line-height:1.5;
          max-width:84%; align-self:flex-end; word-break:break-word;
        }
        .cb-bubble-cart {
          background:#ecfdf5; color:#065f46; border:1.5px solid #6ee7b7;
          border-radius:12px; padding:8px 13px; font-size:.85rem;
          font-weight:600; align-self:flex-start; max-width:92%;
        }
        .cb-chips {
          display:flex; gap:6px; padding:0 12px 8px; flex-wrap:wrap; flex-shrink:0;
        }
        .cb-chip {
          background:#e0f2fe; color:#0369a1; border:none; border-radius:20px;
          padding:5px 11px; font-size:.78rem; cursor:pointer;
          transition:background .15s; white-space:nowrap;
        }
        .cb-chip:hover { background:#bae6fd; }
        .cb-input-row {
          display:flex; gap:6px; padding:10px 12px;
          border-top:1px solid #e2e8f0; background:#fff; flex-shrink:0; align-items:center;
        }
        .cb-input {
          flex:1; padding:9px 13px; border:1.5px solid #e2e8f0;
          border-radius:22px; font-size:.92rem; outline:none;
          transition:border .15s; background:#f8fafc;
          resize:none; font-family:inherit;
        }
        .cb-input:focus { border-color:#0077b6; background:#fff; }
        .cb-icon-btn {
          width:38px; height:38px; border-radius:50%; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; transition:transform .15s; font-size:1rem;
        }
        .cb-icon-btn:hover:not(:disabled) { transform:scale(1.12); }
        .cb-icon-btn:disabled { opacity:.4; cursor:default; }
        .cb-send {
          background:linear-gradient(135deg,#03045e,#0077b6); color:#fff;
        }
        .cb-mic {
          background:#f1f5f9; color:#374151;
        }
        .cb-mic.listening {
          background:#dc2626; color:#fff;
          animation:micpulse 1s infinite;
        }
        .cb-badge {
          font-size:.62rem; padding:2px 6px; border-radius:10px;
          background:rgba(255,255,255,.22); margin-left:5px; vertical-align:middle;
        }
        .cb-hdr-btn {
          background:rgba(255,255,255,.15); border:none; border-radius:8px;
          color:#fff; padding:4px 8px; font-size:.75rem; cursor:pointer;
          transition:background .15s; white-space:nowrap;
        }
        .cb-hdr-btn:hover { background:rgba(255,255,255,.28); }
        .cb-hdr-btn.active { background:rgba(255,209,102,.35); }
        .cb-hdr-controls { display:flex; gap:5px; align-items:center; }
        @media (max-width:500px) {
          .cb-btn { bottom:70px; right:12px; width:50px; height:50px; font-size:1.25rem; }
          .cb-panel {
            left:0; right:0; bottom:62px; top:6px;
            width:100%; border-radius:18px 18px 0 0; max-height:none;
          }
          .cb-messages { height:auto; flex:1; }
        }
      `}</style>

      {/* Floating toggle button */}
      <button
        className={`cb-btn${pulse ? " pulse" : ""}`}
        onClick={() => setOpen(o => !o)}
        title="Chat with BiteBuddy"
        aria-label="Open BiteBuddy food assistant"
      >
        {open ? "✕" : "🍽️"}
      </button>

      {open && (
        <div className="cb-panel">
          {/* Header */}
          <div className="cb-header">
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:"1.4rem" }}>🍽️</span>
              <div>
                <div style={{ fontWeight:700, fontSize:".95rem" }}>
                  BiteBuddy
                  <span className="cb-badge">{usingAI ? "AI" : "Smart"}</span>
                </div>
                <div style={{ fontSize:".7rem", opacity:.8 }}>
                  {menuLoaded
                    ? `${menuItems.filter(i => i.available).length} items available today`
                    : "Loading menu…"}
                </div>
              </div>
            </div>

            {/* Header controls: speaker + lang + close */}
            <div className="cb-hdr-controls">
              {HAS_TTS && (
                <button
                  className={`cb-hdr-btn${speakerOn ? " active" : ""}`}
                  onClick={() => { setSpeakerOn(s => !s); window.speechSynthesis.cancel(); }}
                  title={speakerOn ? "Mute voice" : "Enable voice replies"}
                >
                  {speakerOn ? "🔊" : "🔇"}
                </button>
              )}
              {HAS_STT && (
                <button
                  className={`cb-hdr-btn${voiceLang === "hi-IN" ? " active" : ""}`}
                  onClick={() => setVoiceLang(l => l === "en-IN" ? "hi-IN" : "en-IN")}
                  title={`Voice language: ${voiceLang === "en-IN" ? "Indian English" : "Hindi"} — tap to switch`}
                >
                  {voiceLang === "hi-IN" ? "🇮🇳 HI" : "🇮🇳 EN"}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background:"none", border:"none", color:"#fff", fontSize:"1.2rem", cursor:"pointer", lineHeight:1, padding:"0 2px" }}
              >✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {messages.map((m, i) => (
              <div key={i} className={
                m.role === "bot"  ? "cb-bubble-bot"  :
                m.role === "cart" ? "cb-bubble-cart" :
                                    "cb-bubble-user"
              }>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="cb-bubble-bot" style={{ padding:"4px 8px" }}>
                <TypingDots />
              </div>
            )}
            {listening && (
              <div className="cb-bubble-bot" style={{ color:"#dc2626", fontStyle:"italic", fontSize:".85rem" }}>
                🎤 Listening…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Yes/No confirmation chips */}
          {pendingConfirm && !loading && (
            <div className="cb-chips">
              <button className="cb-chip" style={{ background:"#dcfce7", color:"#166534", fontWeight:700 }}
                onClick={() => sendWithText("yes")}>✅ Yes, add it!</button>
              <button className="cb-chip" style={{ background:"#fee2e2", color:"#991b1b", fontWeight:700 }}
                onClick={() => sendWithText("no")}>❌ No thanks</button>
            </div>
          )}

          {/* Quick chips — before first message */}
          {!pendingConfirm && messages.filter(m => m.role === "user").length === 0 && (
            <div className="cb-chips">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  className="cb-chip"
                  onClick={() => { setInput(chip); setTimeout(() => inputRef.current?.focus(), 50); }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="cb-input-row">
            {/* Mic button */}
            {HAS_STT && (
              <button
                className={`cb-icon-btn cb-mic${listening ? " listening" : ""}`}
                onClick={listening ? stopListening : startListening}
                disabled={loading}
                title={listening ? "Stop listening" : `Speak (${voiceLang === "hi-IN" ? "Hindi" : "Indian English"})`}
              >
                🎤
              </button>
            )}

            <textarea
              ref={inputRef}
              className="cb-input"
              placeholder={listening ? "Listening…" : "Ask me what to eat today…"}
              value={input}
              rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />

            <button
              className="cb-icon-btn cb-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
