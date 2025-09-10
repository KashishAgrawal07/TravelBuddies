import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });

const Collaboration = ({ mode, onClose }) => {
  const [tripCode, setTripCode] = useState('');
  const [tripName, setTripName] = useState('');
  const [collabCreated, setCollabCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for trip updates
    socket.on("tripUpdated", (data) => {
      console.log("Trip Updated:", data);
      alert(`Trip ${data.tripName} updated!`);
    });

    // Listen for user joining notifications
    socket.on("userJoinedNotification", ({ tripCode, username }) => {
      console.log(`User Joined: ${username} in trip ${tripCode}`);
      alert(`${username} has joined trip: ${tripCode}`);
    });

    return () => {
      socket.off("tripUpdated");
      socket.off("userJoinedNotification");
    };
  }, []);

  const handleSubmit = async () => {
    if (isLoading) return; // Prevent multiple submissions
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
  
      // ✅ Get user profile for username
      const userResponse = await axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const username = userResponse.data.name;
      console.log("✅ User Profile Fetched:", username);
  
      if (mode === 'create') {
        if (!tripName.trim()) {
          alert("Please enter a trip name.");
          setIsLoading(false);
          return;
        }

        console.log("🟢 Creating collaboration for trip:", tripName);
  
        const response = await axios.post('http://localhost:5000/api/collaborations', { tripName }, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const createdTrip = response.data;
        console.log("✅ Collaboration Created! Trip Code:", createdTrip.tripCode);
  
        setTripCode(createdTrip.tripCode);
        setCollabCreated(true);
  
        // Navigate with proper state including empty days and activities for new collaboration
        navigate('/iternary', { 
          state: { 
            tripName: createdTrip.tripName, 
            tripCode: createdTrip.tripCode, 
            isCollabActive: true,
            days: [], // Initialize empty for new collaboration
            activities: {} // Initialize empty for new collaboration
          } 
        });
  
        socket.emit('tripCreated', createdTrip);
        onClose(); // Close modal after creating
  
      } else {
        // Join mode
        if (!tripCode.trim()) {
          alert("Please enter a trip code.");
          setIsLoading(false);
          return;
        }

        console.log("🟡 Joining trip with code:", tripCode);
  
        // ✅ Join the collaboration
        const joinResponse = await axios.post('http://localhost:5000/api/collaborations/join', { tripCode }, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        console.log("✅ Successfully joined trip:", joinResponse.data);
  
        // ✅ Fetch latest itinerary after joining
        const itineraryResponse = await axios.get(`http://localhost:5000/api/collaborations/${tripCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        console.log("📌 Itinerary Fetched:", itineraryResponse.data);
        
        const fetchedData = itineraryResponse.data;
  
        // Navigate with fetched collaboration data
        navigate('/iternary', { 
          state: { 
            tripName: fetchedData.tripName, 
            tripCode: fetchedData.tripCode, 
            isCollabActive: true,
            days: fetchedData.days || [], // Pass fetched days
            activities: fetchedData.activities || {}, // Pass fetched activities
            destination: fetchedData.destination || '',
            startDate: fetchedData.startDate || '',
            endDate: fetchedData.endDate || ''
          } 
        });
  
        socket.emit('tripJoined', { tripCode, username });
        onClose(); // ✅ Close modal after joining
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Error processing request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold mb-4">
          {mode === 'create' ? 'Create a Collaboration' : 'Join a Collaboration'}
        </h2>

        {/* Input fields */}
        {mode === 'create' ? (
          <>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="Enter trip name"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {collabCreated && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Code (Share this with others):
                </label>
                <input
                  type="text"
                  value={tripCode}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-center text-lg font-semibold"
                />
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            value={tripCode}
            onChange={(e) => setTripCode(e.target.value.trim())}
            placeholder="Enter trip code"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        )}

        {/* Buttons */}
        <div className="flex justify-between space-x-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading || collabCreated}
            className={`px-6 py-3 rounded-lg text-white font-semibold flex-1 transition-colors ${
              collabCreated 
                ? 'bg-green-500 cursor-default' 
                : isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isLoading 
              ? 'Processing...' 
              : collabCreated 
                ? '✓ Created!' 
                : (mode === 'create' ? 'Create' : 'Join')
            }
          </button>
          <button 
            onClick={handleClose} 
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {collabCreated ? 'Close' : 'Cancel'}
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600 mt-2">
              {mode === 'create' ? 'Creating collaboration...' : 'Joining collaboration...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collaboration;