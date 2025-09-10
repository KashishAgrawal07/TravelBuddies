import React, { useState, useEffect } from 'react';
import Expenses from './Expenses';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Collaboration from './Collaboration';
import { FaCalendarAlt, FaMapMarkerAlt, FaPlus, FaSave } from 'react-icons/fa';

const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });

const Iternary = () => {
  const location = useLocation();

  // ✅ Check if this is a new trip
  const isNewTrip = location.state?.isNewTrip || false;

  // ✅ Get existing trip details if editing a normal trip
  const tripToEdit = location.state?.trip || null;

  // ✅ Get tripCode if coming from a collaboration
  const tripCode = location.state?.tripCode || '';
  const isCollabActive = location.state?.isCollabActive || false;

  // ✅ Set initial form values
  const [itineraryName, setItineraryName] = useState(
    tripToEdit?.itineraryName || 
    (isCollabActive ? location.state?.tripName : '')
  );
  const [destination, setDestination] = useState(
    tripToEdit?.destination || 
    location.state?.destination || 
    ''
  );
  const [startDate, setStartDate] = useState(
    tripToEdit?.startDate ? tripToEdit.startDate.split('T')[0] : 
    location.state?.startDate ? location.state.startDate.split('T')[0] : 
    ''
  );
  const [endDate, setEndDate] = useState(
    tripToEdit?.endDate ? tripToEdit.endDate.split('T')[0] : 
    location.state?.endDate ? location.state.endDate.split('T')[0] : 
    ''
  );
  const [days, setDays] = useState(
    tripToEdit?.days || 
    location.state?.days || 
    []
  );
  const [activities, setActivities] = useState(
    tripToEdit?.activities || 
    location.state?.activities || 
    {}
  );
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [collabMode, setCollabMode] = useState('');
  const [showAIChoice, setShowAIChoice] = useState(false);
  
  // New state for activity inputs
  const [newActivityInputs, setNewActivityInputs] = useState({});

  const [selectedTab, setSelectedTab] = useState('itinerary');

  useEffect(() => {
    if (tripToEdit) {
      // ✅ Load normal trip data
      setDays(tripToEdit.days || []);
      setActivities(tripToEdit.activities || {});
      setShowSaveButton(true);
      return; // Exit early for normal trips
    }

    // ✅ Handle collaboration setup
    if (isCollabActive) {
      console.log("🔷 Setting up collaboration with state:", location.state);
      
      // Set initial collaboration data from navigation state
      if (location.state?.days) {
        setDays(location.state.days);
      }
      if (location.state?.activities) {
        setActivities(location.state.activities);
      }
      if (location.state?.destination) {
        setDestination(location.state.destination);
      }
      if (location.state?.startDate) {
        setStartDate(location.state.startDate.split('T')[0]);
      }
      if (location.state?.endDate) {
        setEndDate(location.state.endDate.split('T')[0]);
      }
      
      setShowSaveButton(true);

      // If we have a tripCode, set up real-time listening
      if (tripCode) {
        console.log("🔷 Setting up real-time collaboration for:", tripCode);
        
        // ✅ Listen for real-time updates
        socket.on('itineraryUpdated', (data) => {
          if (data.tripCode === tripCode) {
            console.log('Real-time update received:', data);
            setDays(data.days || []);
            setActivities(data.activities || {});
          }
        });

        return () => {
          socket.off('itineraryUpdated');
        };
      }
    }
  }, [tripToEdit, tripCode, isCollabActive, location.state]);

  // Separate useEffect for collaboration updates to avoid infinite loops
  useEffect(() => {
    if (isCollabActive && (days.length > 0 || Object.keys(activities).length > 0)) {
      const timeoutId = setTimeout(() => {
        socket.emit("itineraryUpdated", { tripCode, days, activities });
      }, 500); // Debounce to prevent too many emissions

      return () => clearTimeout(timeoutId);
    }
  }, [activities, days, isCollabActive, tripCode]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const handleItineraryInfoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'itineraryName') setItineraryName(value);
    else if (name === 'destination') setDestination(value);
    else if (name === 'startDate') setStartDate(value);
    else if (name === 'endDate') setEndDate(value);
  };

  const handleSaveTrip = async () => {
    try {
      const token = localStorage.getItem("token");

      const sanitizedActivities = {};
      Object.keys(activities).forEach(day => {
        sanitizedActivities[day] = activities[day]
          .filter(a => typeof a === 'string' && a.trim() !== '')  // only keep non-empty strings
          .map(a => a.trim()); // clean up spacing
      });

      const tripData = {
        itineraryName,
        destination,
        startDate,
        endDate,
        days,
        activities: sanitizedActivities
      };

      console.log("🟢 Sending Save Request:", tripData);

      let response;
      if (isCollabActive) {
        response = await axios.put(
          `http://localhost:5000/api/collaborations/update/${tripCode}`,
          {
            tripCode,
            days,
            activities: sanitizedActivities, // ✅ Use sanitized data
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log("✅ Collaboration Trip Updated:", response.data);
        socket.emit("itineraryUpdated", { tripCode, days, activities: sanitizedActivities });

      } else if (tripToEdit) {
        response = await axios.put(`http://localhost:5000/api/trips/${tripToEdit._id}`, tripData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ Normal Trip Updated:", response.data);

      } else {
        response = await axios.post("http://localhost:5000/api/trips", tripData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ New Trip Created:", response.data);
      }

      alert("Trip saved successfully!");
    } catch (error) {
      console.error("❌ Error saving trip:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to save trip.");
    }
  };

  const handleAddActivity = (day) => {
    const newActivity = newActivityInputs[day]?.trim();
    
    if (!newActivity) {
      alert("Please enter an activity before adding.");
      return;
    }

    const updatedActivities = {
      ...activities,
      [day]: [...(activities[day] || []), newActivity],
    };

    setActivities(updatedActivities);
    
    // Clear the input for this day
    setNewActivityInputs(prev => ({
      ...prev,
      [day]: ''
    }));
  };

  const handleActivityInputChange = (day, value) => {
    setNewActivityInputs(prev => ({
      ...prev,
      [day]: value
    }));
  };

  const handleRemoveActivity = (day, activityIndex) => {
    const updatedActivities = { ...activities };
    updatedActivities[day] = updatedActivities[day].filter((_, index) => index !== activityIndex);
    setActivities(updatedActivities);
  };

  const handleGenerateDays = async (useAI) => {
    if (!startDate || !endDate || !destination) {
      alert("Please enter destination and dates before planning.");
      return;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    let tempDays = [];
    let tempActivities = {};

    while (startDateObj <= endDateObj) {
      const dayLabel = `Day ${tempDays.length + 1}`;
      tempDays.push(dayLabel);
      tempActivities[dayLabel] = [];
      startDateObj.setDate(startDateObj.getDate() + 1);
    }

    if (useAI) {
      try {
        const response = await axios.post("http://localhost:5000/api/itinerary/generate", {
          destination,
          startDate,
          endDate
        });

        const { days: generatedDays, activities: generatedActivities } = response.data;
        setDays(generatedDays);
        setActivities(generatedActivities);
      } catch (error) {
        console.error("❌ AI Itinerary Generation Failed:", error);
        alert("Failed to generate AI itinerary. Using manual mode.");
        setDays(tempDays);
        setActivities(tempActivities);
      }
    } else {
      setDays(tempDays);
      setActivities(tempActivities);
    }

    setShowSaveButton(true);
  };

  return (
    <div className="min-h-screen bg-white px-8 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Navbar */}
        <div className="flex space-x-6 border-b border-gray-300 pb-4 mb-8">
          <button
            onClick={() => handleTabChange('itinerary')}
            className={`px-6 py-2 font-semibold text-lg transition ${selectedTab === 'itinerary' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-500'
              }`}
          >
            Itinerary
          </button>
          <button
            onClick={() => handleTabChange('expenses')}
            className={`px-6 py-2 font-semibold text-lg transition ${selectedTab === 'expenses' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-500'
              }`}
          >
            Expenses
          </button>
        </div>

        {/* ✅ Collaboration Buttons (Only show for new trip) */}
        {isNewTrip && !isCollabActive && (
          <div className="flex space-x-4 justify-center mb-6">
            <button
              onClick={() => { setCollabMode('create'); setShowCollab(true); }}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-500 transition"
            >
              Create Collaboration
            </button>
            <button
              onClick={() => { setCollabMode('join'); setShowCollab(true); }}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 transition"
            >
              Join Collaboration
            </button>
          </div>
        )}

        {/* Itinerary Tab */}
        {selectedTab === 'itinerary' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800">Plan Your Trip</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                name="itineraryName"
                value={itineraryName}
                onChange={handleItineraryInfoChange}
                placeholder="Trip Name"
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                disabled={isCollabActive}
              />
              <input
                type="text"
                name="destination"
                value={destination}
                onChange={handleItineraryInfoChange}
                placeholder="Destination"
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                disabled={isCollabActive && location.state?.destination} // Disable if destination comes from collaboration
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="date"
                name="startDate"
                value={startDate}
                onChange={handleItineraryInfoChange}
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                name="endDate"
                value={endDate}
                onChange={handleItineraryInfoChange}
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!showSaveButton && (
              <button
                onClick={() => setShowAIChoice(true)}
                className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition"
              >
                Start Planning
              </button>
            )}

            {/* Itinerary Display */}
            <div className="mt-6 space-y-6">
              {days.length > 0 && days.map((day, index) => {
                const firstActivity = activities[day]?.[0] || "Travel Destination";
                return (
                  <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Image for the activity */}
                    <img
                      src={`https://source.unsplash.com/600x300/?${encodeURIComponent(firstActivity)}`}
                      alt={firstActivity}
                      className="w-full h-40 object-cover"
                    />

                    {/* Card Content */}
                    <div className="p-6">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{day}</h2>
                      
                      {/* Existing Activities */}
                      {activities[day]?.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-700 mb-2">Activities:</h3>
                          <ul className="space-y-2">
                            {activities[day].map((activity, i) => (
                              <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <span className="text-gray-800">{activity}</span>
                                <button
                                  onClick={() => handleRemoveActivity(day, i)}
                                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Add New Activity */}
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newActivityInputs[day] || ''}
                          onChange={(e) => handleActivityInputChange(day, e.target.value)}
                          placeholder={`Add an activity for ${day}`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddActivity(day);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddActivity(day)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <FaPlus className="text-sm" />
                          <span>Add Activity</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ Show Collaboration Modal if needed */}
            {showCollab && <Collaboration mode={collabMode} onClose={() => setShowCollab(false)} />}
            
            {/* Save Trip Button */}
            {showSaveButton && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleSaveTrip}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <FaSave />
                  <span>Save Trip</span>
                </button>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'expenses' && <Expenses />}

        {/* AI Choice Modal */}
        {showAIChoice && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
              <h2 className="text-xl font-semibold mb-4">Choose Itinerary Mode</h2>
              <p className="mb-6 text-gray-600">Would you like an AI-generated itinerary or do you prefer manual planning?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => { setShowAIChoice(false); handleGenerateDays(false); }}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 transition"
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => { setShowAIChoice(false); handleGenerateDays(true); }}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-500 transition"
                >
                  Generate with AI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Iternary;