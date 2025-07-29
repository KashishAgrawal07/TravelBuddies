import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import homeBg from '../assets/images/Home.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');  // Error state for feedback
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Make the POST request to the login route (correct method)
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // Save the token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Redirect the user to the profile page
      navigate('/profile');
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed, please try again.');
    }
  };

  return (
    <div className="home-container min-h-screen  flex items-center justify-center p-5 " >
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full justify-center  ">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Login to TravelBuddies</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email" 
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Password Input */}
          <div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password" 
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Login Button */}
          <div>
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none transition duration-300"
            >
              Login
            </button>
          </div>
        </form>

        {/* Link to Register */}
        <div className="mt-4 text-center">
          <Link to="/register" className="text-blue-500 hover:text-blue-700 text-sm">
            New User? Sign up here
          </Link>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-center mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
