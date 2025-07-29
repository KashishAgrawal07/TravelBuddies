import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });


const Collaboration = ({ mode, onClose }) => {
  const [tripCode, setTripCode] = useState('');
  const [tripName, setTripName] = useState('');
  const [collabCreated, setCollabCreated] = useState(false); // To track if trip is created
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
      socket.off("userJoinedNotification"); // Clean up listener
    };
  }, []);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
  
      // ✅ Get user profile for username
      const userResponse = await axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const username = userResponse.data.name;
      console.log("✅ User Profile Fetched:", username);
  
      if (mode === 'create') {
        console.log("🟢 Creating collaboration for trip:", tripName);
  
        const response = await axios.post('http://localhost:5000/api/collaborations', { tripName }, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const createdTrip = response.data;
        console.log("✅ Collaboration Created! Trip Code:", createdTrip.tripCode);
  
        setTripCode(createdTrip.tripCode);
        setCollabCreated(true);
  
        navigate('/iternary', { 
          state: { 
            tripName: createdTrip.tripName, 
            tripCode: createdTrip.tripCode, 
            isCollabActive: true 
          } 
        });
  
        socket.emit('tripCreated', createdTrip);
  
      } else {
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
  
        if (itineraryResponse.data.days && itineraryResponse.data.activities) {
          setDays(itineraryResponse.data.days);
          setActivities(itineraryResponse.data.activities);
        } else {
          console.warn("⚠️ No days or activities found in fetched itinerary.");
        }
  
        navigate('/iternary', { 
          state: { 
            tripName: itineraryResponse.data.tripName, 
            tripCode: itineraryResponse.data.tripCode, 
            isCollabActive: true 
          } 
        });
  
        socket.emit('tripJoined', { tripCode, username });
  
        onClose(); // ✅ Close modal after joining
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Error processing request.");
    }
  };
  

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
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
              className="w-full p-2 border rounded-md mb-4"
              disabled={collabCreated} // Disable tripName input after creation
            />
            {collabCreated && (
              <input
                type="text"
                value={tripCode}
                readOnly
                className="w-full p-2 border rounded-md mb-4 bg-gray-200"
              />
            )}
          </>
        ) : (
          <input
            type="text"
            value={tripCode}
            onChange={(e) => setTripCode(e.target.value)}
            placeholder="Enter trip code"
            className="w-full p-2 border rounded-md mb-4"
          />
        )}

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-md ${collabCreated ? 'bg-green-500' : 'bg-blue-500'} text-white`}
            disabled={collabCreated} // Disable button after creation
          >
            {collabCreated ? 'Created!' : (mode === 'create' ? 'Create' : 'Join')}
          </button>
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-md">
            {collabCreated ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
