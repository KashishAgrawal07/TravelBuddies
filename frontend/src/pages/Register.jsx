import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');  // Error state for feedback
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Make the POST request to the register route
      await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      // Redirect to login page after successful registration
      navigate('/login');
    } catch (error) {
      // Set error message in case of failure
      setError(error.response?.data?.error || 'Registration failed, please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 via-blue-100 to-green-400 flex items-center justify-center p-5">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Create an Account</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name Input */}
          <div>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Full Name" 
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email Input */}
          <div>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email" 
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Register Button */}
          <div>
            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none transition duration-300"
            >
              Register
            </button>
          </div>
        </form>

        {/* Link to Login */}
        <div className="mt-4 text-center">
          <p className="text-sm">Already have an account? <a href="/login" className="text-indigo-500 hover:text-indigo-700">Login here</a></p>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-center mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default Register;
