import { Routes, Route } from "react-router-dom";
import './App.css';

import Home from './pages/Home/Home';
import Sign from './pages/Auth/Sign';
import Login from './pages/Auth/Login';
import Navbar from "./components/Navbar";
import Profile from './pages/Profile/Profile';
import BuySell from './pages/Marketplace/BuySell';
import SellItem from './pages/Marketplace/SellItem';
import Rent from './pages/Rent/Rent';
import RentItem from './pages/Rent/RentItem';
import LostFound from './pages/LostFound/LostFound';
import LostFoundItem from './pages/LostFound/LostFoundItem';
import Wishlist from "./pages/Wishlist/Wishlist";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/sign" element={<Sign />} />
  <Route path="/login" element={<Login />} />

  <Route path="/marketplace" element={<BuySell />} />
  <Route path="/rent" element={<Rent />} />
  <Route path="/rent-item" element={<RentItem />} />
  <Route path="/lostfound" element={<LostFound />} />
  <Route path="/lostfound-item" element={<LostFoundItem />} />
  <Route path="/wishlist" element={<Wishlist />} />

  <Route element={<ProtectedRoute />}>
    <Route path="/profile" element={<Profile />} />
    <Route path="/sell-item" element={<SellItem />} />
  </Route>
</Routes>
    </>
  );
}

export default App;