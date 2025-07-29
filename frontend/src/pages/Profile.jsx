import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../index.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [currentTrips, setCurrentTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        setError('Failed to fetch profile data');
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem("token");

        // ✅ Fetch normal trips
        const userTripsResponse = await axios.get("http://localhost:5000/api/trips", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let userCurrentTrips = userTripsResponse.data.currentTrips;
        let userPastTrips = userTripsResponse.data.pastTrips;

        // ✅ Fetch collaboration trips
        const collabTripsResponse = await axios.get("http://localhost:5000/api/collaborations", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let collabCurrentTrips = collabTripsResponse.data.currentTrips;
        let collabPastTrips = collabTripsResponse.data.pastTrips;

        // ✅ Merge both normal and collaboration trips
        setCurrentTrips([...userCurrentTrips, ...collabCurrentTrips]);
        setPastTrips([...userPastTrips, ...collabPastTrips]);

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching trips:", error);
        setError('Failed to fetch trips');
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const handleEditTrip = (trip) => {
    navigate("/iternary", { state: { trip } }); // Send trip details as state
  };

  const handleDeleteTrip = async (tripId, isCollab = false) => {
    try {
      const token = localStorage.getItem("token");
      const url = isCollab 
        ? `http://localhost:5000/api/collaborations/${tripId}` 
        : `http://localhost:5000/api/trips/${tripId}`;

      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCurrentTrips((prevTrips) => prevTrips.filter(trip => trip._id !== tripId));
      setPastTrips((prevTrips) => prevTrips.filter(trip => trip._id !== tripId));

      alert("Trip deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting trip:", error);
      alert("Failed to delete trip.");
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <div className="min-h-screen bg-white px-8 py-12">
      <div className="max-w-6xl mx-auto">

        {/* User Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-green-600">Welcome, {user?.name}!</h1>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Current Trips Section */}
        <section>
          <h2 className="text-3xl font-semibold text-gray-700 mb-6">Current Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTrips.length > 0 ? (
              currentTrips.map((trip) => (
                <div key={trip._id} className="bg-white border border-gray-300 p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <h3 className="text-xl font-semibold text-gray-900">{trip.itineraryName || trip.tripName}</h3>
                  <p className="text-gray-600">{trip.destination || "Collaboration Trip"}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between mt-4">
                    <button 
                      onClick={() => handleEditTrip(trip)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTrip(trip._id, trip.tripCode ? true : false)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No current trips</p>
            )}
          </div>
        </section>

        {/* Past Trips Section */}
        <section className="mt-12">
          <h2 className="text-3xl font-semibold text-gray-700 mb-6">Past Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastTrips.length > 0 ? (
              pastTrips.map((trip) => (
                <div key={trip._id} className="bg-white border border-gray-300 p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <h3 className="text-xl font-semibold text-gray-900">{trip.itineraryName || trip.tripName}</h3>
                  <p className="text-gray-600">{trip.destination || "Collaboration Trip"}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex justify-end mt-4">
                    <button 
                      onClick={() => handleDeleteTrip(trip._id, trip.tripCode ? true : false)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No past trips</p>
            )}
          </div>
        </section>

        {/* New Trip Button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => navigate('/iternary', { state: { isNewTrip: true } })}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300"
          >
            + Create New Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
