import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";

// Customer pages
import Landing from "./pages/Landing";
import Menu from "./pages/Menu";
import Description from "./pages/Description";
import Cart from "./pages/Cart";
import OrderConfirmation from "./pages/OrderConfirmation";

// Auth
import Login from "./pages/Login";

// Staff pages
import CanteenPanel from "./pages/CanteenPanel";
import MenuManagement from "./pages/MenuManagement";
import AddMenu from "./pages/AddMenu";
import KOT from "./pages/KOT";
import Ready from "./pages/Ready";
import StaffAttendance from "./pages/StaffAttendance";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import Expense from "./pages/Expense";
import StaffManagement from "./pages/StaffManagement";

// Info pages
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer routes (public) */}
        <Route path="/" element={<Landing />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/item/:id" element={<Description />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Staff routes (protected) */}
        <Route path="/canteen" element={<AuthGuard><CanteenPanel /></AuthGuard>} />
        <Route path="/menu-management" element={<AuthGuard><MenuManagement /></AuthGuard>} />
        <Route path="/add-menu" element={<AuthGuard><AddMenu /></AuthGuard>} />
        <Route path="/kot" element={<AuthGuard><KOT /></AuthGuard>} />
        <Route path="/ready" element={<AuthGuard><Ready /></AuthGuard>} />
        <Route path="/staff-attendance" element={<AuthGuard><StaffAttendance /></AuthGuard>} />

        {/* Admin routes (protected) */}
        <Route path="/admin" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
        <Route path="/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
        <Route path="/expenses" element={<AuthGuard><Expense /></AuthGuard>} />
        <Route path="/staff" element={<AuthGuard><StaffManagement /></AuthGuard>} />

        {/* Info pages */}
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
      </Routes>
    </BrowserRouter>
  );
}
