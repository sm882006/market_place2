import { Routes, Route } from "react-router-dom";
import './App.css';

import Home from './pages/Home/Home';
import Sign from './pages/Auth/Sign';
import Login from './pages/Auth/Login';
import Navbar from "./components/Navbar";
import Profile from './pages/Profile/Profile';
import BuySell from './pages/Marketplace/BuySell';
import SellItem from './pages/Marketplace/SellItem';
import ProductDetailPage from './pages/ProductDetail/ProductDetailPage';
import Rent from './pages/Rent/Rent';
import RentItem from './pages/Rent/RentItem';
import LostFound from './pages/LostFound/LostFound';
import LostFoundItem from './pages/LostFound/LostFoundItem';
import Wishlist from "./pages/Wishlist/Wishlist";
import OrderTracking from "./pages/Orders/OrderTracking";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign" element={<Sign />} />
        <Route path="/login" element={<Login />} />

        <Route path="/marketplace" element={<BuySell />} />
        <Route path="/marketplace/:id" element={<ProductDetailPage />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/rent-item" element={<RentItem />} />
        <Route path="/lostfound" element={<LostFound />} />
        <Route path="/lostfound-item" element={<LostFoundItem />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/orders" element={<OrderTracking />} />
        <Route path="/admin" element={<AdminDashboard />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/sell-item" element={<SellItem />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;