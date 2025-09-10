import express from 'express';
import Collaboration from '../models/Collaboration.js';
import { verifyToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new collaboration (Trip)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { tripName } = req.body;
    const tripCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newTrip = new Collaboration({ 
      tripName, 
      tripCode, 
      members: [req.user.id],
      days: [],
      activities: {}
    });
    await newTrip.save();

    console.log("✅ Trip created successfully:", newTrip);

    // ✅ Emit to specific trip room instead of all users
    const io = req.app.get('io');
    io.to(tripCode).emit('tripUpdated', newTrip);

    res.json(newTrip);
  } catch (error) {
    console.error("❌ Error creating trip:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join an existing trip
router.post('/join', verifyToken, async (req, res) => {
  try {
    console.log("🔵 Received request to join trip");
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

    // ✅ Emit to specific trip room
    const io = req.app.get('io');
    io.to(tripCode).emit('userJoinedNotification', { tripCode, username: user.name });

    res.json({ 
      message: "Successfully joined the trip!", 
      tripName: trip.tripName,
      tripCode: trip.tripCode,
      days: trip.days || [],
      activities: trip.activities || {}
    });

  } catch (error) {
    console.error("❌ Error in /join route:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ FIXED: Update itinerary route
router.put('/update/:tripCode', verifyToken, async (req, res) => {
  try {
    const { tripCode } = req.params;
    const { days, activities } = req.body;

    console.log("🔵 Updating itinerary for trip:", tripCode);
    console.log("Received Data:", { days, activities });

    if (!days && !activities) {
      console.log("❌ Error: No data provided for update");
      return res.status(400).json({ message: "Days or activities are required" });
    }

    const trip = await Collaboration.findOne({ tripCode });

    if (!trip) {
      console.log("❌ Error: No trip found for code", tripCode);
      return res.status(404).json({ message: "Trip not found" });
    }

    // ✅ Check if user is a member of this trip
    if (!trip.members.includes(req.user.id)) {
      console.log("❌ Error: User not authorized for trip", tripCode);
      return res.status(403).json({ message: "You are not a member of this trip" });
    }

    // ✅ Sanitize and validate activities
    let sanitizedActivities = trip.activities || {};
    
    if (activities) {
      sanitizedActivities = {};
      Object.keys(activities).forEach((day) => {
        if (Array.isArray(activities[day])) {
          sanitizedActivities[day] = activities[day]
            .filter(activity => activity && typeof activity === 'string' && activity.trim() !== '')
            .map(activity => String(activity).trim());
        } else {
          sanitizedActivities[day] = [];
        }
      });
    }

    // ✅ Update the trip
    if (days) {
      trip.days = days.filter(day => day && typeof day === 'string');
    }
    
    trip.activities = sanitizedActivities;
    
    // ✅ Mark the field as modified for Mixed type
    trip.markModified('activities');
    
    await trip.save();

    console.log("✅ Itinerary Updated Successfully:", {
      tripCode,
      days: trip.days,
      activities: trip.activities
    });
    
    // ✅ Emit to specific trip room only
    const io = req.app.get('io');
    io.to(tripCode).emit('itineraryUpdated', { 
      tripCode, 
      days: trip.days, 
      activities: trip.activities,
      updatedBy: req.user.id 
    });

    res.json({ 
      message: "Itinerary updated successfully!", 
      days: trip.days, 
      activities: trip.activities 
    });

  } catch (error) {
    console.error("❌ Error in /update/:tripCode route:", error);
    console.error("❌ Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all trips for user
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log("🔵 Fetching all collaboration trips for user:", req.user.id);

    const trips = await Collaboration.find({ members: req.user.id });

    if (!trips.length) {
      return res.json({ currentTrips: [], pastTrips: [] });
    }

    const currentDate = new Date();

    // Since collaboration trips don't have endDate, consider all as current
    const currentTrips = trips;
    const pastTrips = [];

    console.log("✅ Collaboration Trips Fetched:", { currentTrips, pastTrips });

    res.json({ currentTrips, pastTrips });

  } catch (error) {
    console.error("❌ Error fetching collaboration trips:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Trip Details by tripCode
router.get('/:tripCode', verifyToken, async (req, res) => {
  try {
    const { tripCode } = req.params;
    console.log("🔵 Fetching trip details for code:", tripCode);
    
    const trip = await Collaboration.findOne({ tripCode });

    if (!trip) {
      console.log("❌ Trip not found:", tripCode);
      return res.status(404).json({ message: 'Trip not found' });
    }

    // ✅ Check if user is a member
    if (!trip.members.includes(req.user.id)) {
      console.log("❌ User not authorized for trip:", tripCode);
      return res.status(403).json({ message: 'You are not a member of this trip' });
    }

    console.log("✅ Trip details fetched successfully:", {
      tripCode,
      tripName: trip.tripName,
      memberCount: trip.members.length,
      daysCount: trip.days?.length || 0
    });

    res.json({
      tripName: trip.tripName,
      tripCode: trip.tripCode,
      members: trip.members,
      days: trip.days || [], 
      activities: trip.activities || {},
    });
  } catch (error) {
    console.error('❌ Error fetching trip details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;