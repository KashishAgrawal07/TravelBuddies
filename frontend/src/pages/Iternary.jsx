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
  const [itineraryName, setItineraryName] = useState(tripToEdit?.itineraryName || (isCollabActive ? location.state?.tripName : ''));
  const [destination, setDestination] = useState(tripToEdit?.destination || '');
  const [startDate, setStartDate] = useState(tripToEdit?.startDate ? tripToEdit.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(tripToEdit?.endDate ? tripToEdit.endDate.split('T')[0] : '');
  const [days, setDays] = useState(tripToEdit?.days || []);
  const [activities, setActivities] = useState(tripToEdit?.activities || {});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [collabMode, setCollabMode] = useState('');
  const [showAIChoice, setShowAIChoice] = useState(false);



  const [selectedTab, setSelectedTab] = useState('itinerary');
  useEffect(() => {
    if (tripToEdit) {
      // ✅ Load normal trip data
      setDays(tripToEdit.days || []);
      setActivities(tripToEdit.activities || {});
      setShowSaveButton(true);
    }

    if (!tripCode) return; // ✅ No tripCode means this is a normal trip, no need to fetch collab data

    // ✅ Fetch latest itinerary when joining a collab
    const fetchItinerary = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/collaborations/${tripCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setItineraryName(response.data.tripName);
        setDays(response.data.days || []);
        setActivities(response.data.activities || {});
        setShowSaveButton(true);
      } catch (error) {
        console.error("Error fetching itinerary:", error);
      }
    };

    fetchItinerary();

    // ✅ Listen for real-time updates
    socket.on('itineraryUpdated', (data) => {
      if (data.tripCode === tripCode) {
        console.log('Real-time update received:', data);
        setDays(data.days);
        setActivities(data.activities);
      }
    });

    return () => {
      socket.off('itineraryUpdated');
    };
  }, [tripToEdit, tripCode]);

  useEffect(() => {
    if (isCollabActive) {
      socket.emit("itineraryUpdated", { tripCode, days, activities });
    }
  }, [activities, days]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const handleItineraryInfoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'itineraryName') setItineraryName(value);
    else if (name === 'destination') setDestination(value);
    else if (name === 'startDate') setStartDate(value);
    else if (name === 'endDate') setEndDate(value);

    if (isCollabActive) {
      socket.emit("itineraryUpdated", { tripCode, days, activities });
    }
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
    const updatedActivities = {
      ...activities,
      [day]: [...(activities[day] || []), ""], // Add new empty string
    };

    setActivities(updatedActivities);

    if (isCollabActive) {
      socket.emit("itineraryUpdated", { tripCode, days, activities: updatedActivities });
    }
  };

  const handleActivityChange = (day, index, value) => {
    const updatedActivities = { ...activities };

    if (!updatedActivities[day]) {
      updatedActivities[day] = [];
    }

    updatedActivities[day] = [...updatedActivities[day]];
    updatedActivities[day][index] = String(value); // 🔒 Force string

    setActivities(updatedActivities);

    if (isCollabActive) {
      socket.emit("itineraryUpdated", { tripCode, days, activities: updatedActivities });
    }
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
        alert("Failed to generate AI itinerary.");
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
          <div className="flex space-x-4 justify-center">
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

            <button
              onClick={() => setShowAIChoice(true)}
              className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition"
            >
              Start Planning
            </button>


            {/* Itinerary Display */}
            <div className="mt-6 space-y-6">
              {days.length > 0 && days.map((day, index) => {
                const firstActivity = activities[day]?.[0] || "Travel Destination";
                return (
                  <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Image for the activity */}
                    <img
                      src={`https://source.unsplash.com/600x300/?${firstActivity}`}
                      alt={firstActivity}
                      className="w-full h-40 object-cover"
                    />

                    {/* Card Content */}
                    <div className="p-4">
                      <h2 className="text-xl font-semibold text-gray-800">{day}</h2>
                      <ul className="mt-2 space-y-2">
                        {activities[day]?.map((activity, i) => (
                          <li key={i} className="p-2 bg-gray-100 rounded-md">{activity}</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          const newActivity = prompt(`Add an activity for ${day}`);
                          if (newActivity && typeof newActivity === 'string' && newActivity.trim() !== '') {
                            setActivities((prev) => ({
                              ...prev,
                              [day]: [...(prev[day] || []), newActivity.trim()],
                            }));

                            if (isCollabActive) {
                              socket.emit("itineraryUpdated", {
                                tripCode,
                                days,
                                activities: {
                                  ...activities,
                                  [day]: [...(activities[day] || []), newActivity.trim()]
                                }
                              });
                            }
                          }
                        }}

                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-1"
                      >
                        <FaPlus /> <span>Add Activity</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>




            {/* ✅ Show Collaboration Modal if needed */}
            {showCollab && <Collaboration mode={collabMode} onClose={() => setShowCollab(false)} />}
            {showSaveButton && (
              <button
                onClick={handleSaveTrip}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition mt-6"
              >
                Save Trip
              </button>
            )}
          </div>
        )}

        {selectedTab === 'expenses' && <Expenses />}


        {showAIChoice && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Choose Itinerary Mode</h2>
              <p className="mb-6">Would you like an AI-generated itinerary or do you prefer manual planning?</p>
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
