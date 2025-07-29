import express from 'express';
import Collaboration from '../models/Collaboration.js'; // MongoDB Model
import { verifyToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new collaboration (Trip)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { tripName } = req.body;
    const tripCode = Math.random().toString(36).substr(2, 6).toUpperCase(); // Generate random code
    const newTrip = new Collaboration({ tripName, tripCode, members: [req.user.id] });
    await newTrip.save();

    // Emit event to notify all connected users
    req.app.get('io').emit('tripUpdated', newTrip);

    res.json(newTrip);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join an existing trip
router.post('/join', verifyToken, async (req, res) => {
  try {
    console.log("🔵 Received request to join trip"); // ✅ Log request
    console.log("Request Body:", req.body);

    const { tripCode } = req.body;

    if (!tripCode) {
      console.log("❌ Error: tripCode is missing!");
      return res.status(400).json({ message: "Trip code is required" });
    }

    const trip = await Collaboration.findOne({ tripCode });

    if (!trip) {
      console.log("❌ Error: Trip not found for code:", tripCode);
      return res.status(404).json({ message: "Trip not found. Please check the code." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("❌ Error: User not found in DB");
      return res.status(404).json({ message: "User not found." });
    }

    if (!trip.members.includes(req.user.id)) {
      trip.members.push(req.user.id);
      await trip.save();
      console.log(`✅ User ${user.name} added to trip ${tripCode}`);
    } else {
      console.log("⚠️ User is already in the trip.");
    }

    req.app.get('io').emit('userJoinedNotification', { tripCode, username: user.name });

    res.json({ message: "Successfully joined the trip!" });

  } catch (error) {
    console.error("❌ Error in /join route:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.put('/update/:tripCode', verifyToken, async (req, res) => {
  try {
    const { tripCode } = req.params;
    const { days, activities } = req.body;

    console.log("🔵 Updating itinerary for trip:", tripCode);
    console.log("Received Data:", { days, activities });

    if (!days || !activities) {
      console.log("❌ Error: Missing days or activities in request");
      return res.status(400).json({ message: "Days and activities are required" });
    }

     // ✅ Validate that activities contain only strings
     if (!activities || typeof activities !== "object") {
      console.log("❌ Error: Invalid activities format");
      return res.status(400).json({ message: "Activities must be an object with arrays of strings" });
    }

    // ✅ Convert all activity values to string arrays
    Object.keys(activities).forEach((day) => {
      if (!Array.isArray(activities[day])) {
        activities[day] = [];
      }
      activities[day] = activities[day].map((a) => String(a)); // ✅ Ensure all activities are strings
    });

    const trip = await Collaboration.findOne({ tripCode });

    if (!trip) {
      console.log("❌ Error: No trip found for code", tripCode);
      return res.status(404).json({ message: "Trip not found" });
    }

    // ✅ Update only if values exist
    trip.days = days;
    trip.activities = activities;
    await trip.save();

    console.log("✅ Itinerary Updated Successfully:", trip);
    req.app.get('io').emit('itineraryUpdated', { tripCode, days, activities });

    res.json({ message: "Itinerary updated successfully!", days, activities });

  } catch (error) {
    console.error("❌ Error in /update/:tripCode route:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.get('/', verifyToken, async (req, res) => {
  try {
    console.log("🔵 Fetching all collaboration trips for user:", req.user.id);

    const trips = await Collaboration.find({ members: req.user.id });

    if (!trips.length) {
      return res.json({ currentTrips: [], pastTrips: [] });
    }

    const currentDate = new Date();

    const currentTrips = trips.filter(trip => new Date(trip.endDate) >= currentDate);
    const pastTrips = trips.filter(trip => new Date(trip.endDate) < currentDate);

    console.log("✅ Collaboration Trips Categorized:", { currentTrips, pastTrips });

    res.json({ currentTrips, pastTrips });

  } catch (error) {
    console.error("❌ Error fetching collaboration trips:", error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ Get Trip Details by tripCode (for joining & real-time sync)
router.get('/:tripCode', verifyToken, async (req, res) => {
  try {
    const { tripCode } = req.params;
    const trip = await Collaboration.findOne({ tripCode });

    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    res.json({
      tripName: trip.tripName,
      tripCode: trip.tripCode,
      members: trip.members,
      days: trip.days, 
      activities: trip.activities,
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
