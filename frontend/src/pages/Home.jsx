import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

// Import images correctly
import homeBg from '../assets/images/Home.jpg';
import logo from '../assets/images/logo.jpg'; 
import travel1 from '../assets/images/travel1.jpg';
import travel2 from '../assets/images/travel2.jpg';
import travel3 from '../assets/images/travel3.jpg';
import collaborationImg from '../assets/images/collaboration.jpg';
import itineraryImg from '../assets/images/itinerary.jpg';
import expensesImg from '../assets/images/expenses.jpg';

const Home = () => {
  const navigate = useNavigate();  // Initialize the navigate function

  // Function to handle login button click
  const handleLoginClick = () => {
    navigate('/login');  // Navigate to the login page
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${homeBg})` }}>
      <div className="absolute inset-0"></div>
      {/* ✅ Logo & Heading - Positioned Side by Side */}
      <div className="relative z-10 flex items-center justify-center p-6 space-x-4">
        <img src={logo} alt="TravelBuddies Logo" className="h-16 w-auto object-contain" /> {/* ✅ Logo */}
        <h1 className="text-5xl font-extrabold text-shadow-lg text-black">TravelBuddies</h1> {/* ✅ Header */}
      </div>
      <div className="relative z-10 flex flex-col justify-center items-center text-center">

        <p className="text-lg max-w-2xl mx-auto mb-6 mt-4">
          Plan your dream vacations with friends and family. Let TravelBuddies guide your travel experience from start to finish.
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={handleLoginClick} 
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300"
          >
            Get started
          </button>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="relative w-full overflow-hidden mt-10">
        <div className="flex animate-slide">
          <img src={travel1} alt="Travel 1" className="w-full h-80 object-cover rounded-lg shadow-md mx-2" />
          <img src={travel2} alt="Travel 2" className="w-full h-80 object-cover rounded-lg shadow-md mx-2" />
          <img src={travel3} alt="Travel 3" className="w-full h-80 object-cover rounded-lg shadow-md mx-2" />
        </div>
      </div>

      <div className="bg-white py-20">
        <div className="container mx-auto px-5 text-center">
          <h2 className="text-3xl font-semibold mb-8">Why Choose TravelBuddies?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
              <img src={collaborationImg} alt="Collaboration" className="mb-4 w-full h-40 object-cover rounded-md" />
              <h3 className="text-xl font-semibold mb-4">Real-time Collaboration</h3>
              <p className="text-gray-600">Work together on your travel plans with friends and family in real-time. Share itineraries, budgets, and activities instantly.</p>
            </div>
            <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
              <img src={itineraryImg} alt="Itinerary" className="mb-4 w-full h-40 object-cover rounded-md" />
              <h3 className="text-xl font-semibold mb-4">Personalized Itineraries</h3>
              <p className="text-gray-600">Get customized travel itineraries tailored to your preferences and budget. Let AI suggest the best options for you.</p>
            </div>
            <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
              <img src={expensesImg} alt="Expense Tracking" className="mb-4 w-full h-40 object-cover rounded-md" />
              <h3 className="text-xl font-semibold mb-4">Expense Tracking</h3>
              <p className="text-gray-600">Easily track shared expenses. Split bills with friends and see who owes what, in real-time, for a hassle-free travel experience.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 py-6">
        <div className="container mx-auto text-center text-white">
          <p>&copy; 2025 TravelBuddies. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <a href="#" className="text-indigo-400 hover:text-indigo-500">Privacy Policy</a>
            <a href="#" className="text-indigo-400 hover:text-indigo-500">Terms & Conditions</a>
            <a href="#" className="text-indigo-400 hover:text-indigo-500">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
