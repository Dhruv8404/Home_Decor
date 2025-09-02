import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from 'axios';
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CartPageDemo from './pages/CartPage';
import WatchlistPage from './pages/WatchlistPage';
import CheckoutPage from './pages/CheckoutPage';
import MyProfile from './pages/profile';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState({ name: 'Guest' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token found:', !!token); // Debug log
    if (token) {
      // Fetch user data from backend
      fetchUserData(token);
    } else {
      console.log('No token found, setting to Guest'); // Debug log
      setUser({ name: 'Guest' });
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      // Try to get user profile data from profile endpoint
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Profile API response:', response.data); // Debug log
      setUser({
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar
      });
    } catch (error) {
      console.error('Failed to fetch user data from profile API:', error);
      // If profile endpoint doesn't exist, try to decode JWT token
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token payload:', payload); // Debug log
        setUser({
          name: payload.name || payload.username || payload.userName || payload.user?.name || 'Guest',
          email: payload.email || payload.user?.email || '',
          avatar: payload.avatar || payload.user?.avatar
        });
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        // If token is invalid, remove it and set to guest
        localStorage.removeItem('token');
        setUser({ name: 'Guest' });
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser({ name: 'Guest' });
    window.location.href = '/login';
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <Layout user={user} onLogout={handleLogout}>
            <Dashboard />
          </Layout>
        } />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cart" element={
          <Layout user={user} onLogout={handleLogout}>
            <CartPageDemo />
          </Layout>
        } />
        <Route path="/watchlist" element={
          <Layout user={user} onLogout={handleLogout}>
            <WatchlistPage />
          </Layout>
        } />
        <Route path="/checkout" element={
          <Layout user={user} onLogout={handleLogout}>
            <CheckoutPage />
          </Layout>
        } />
        <Route path="/profile" element={
          <Layout user={user} onLogout={handleLogout}>
            <MyProfile />
          </Layout>
        } />
        <Route path="/orders" element={
          <Layout user={user} onLogout={handleLogout}>
            <OrdersPage />
          </Layout>
        } />
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
