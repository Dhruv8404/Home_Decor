import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => {
    setData({ ...data, [e.target.name]: e.target.value });
    console.log('Data updated:', { ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('Submitting data:', data);
    try {
      // Make sure the URL matches your backend route
      const res = await axios.post('http://localhost:5000/api/auth/login', data);
      console.log('Response:', res.data);
      
      // Save token and navigate to appropriate dashboard
      localStorage.setItem('token', res.data.token);
      
      // Check if user is admin by making a test request to admin endpoint
      try {
        const adminCheck = await axios.get('http://localhost:5000/api/admin', {
          headers: { Authorization: `Bearer ${res.data.token}` }
        });
        
        if (adminCheck.data.user.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch {
        // If admin check fails, assume regular user
        console.log('Admin check failed, redirecting to regular dashboard');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={data.email}
          className="w-full p-2 mb-3 border border-gray-300 rounded"
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={data.password}
          className="w-full p-2 mb-3 border border-gray-300 rounded"
          onChange={handleChange}
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;