import express from "express";
import Trip from "../models/Trip.js";
import { verifyToken } from "../middleware/auth.js"; // Middleware for authentication

const router = express.Router();

// Create a new trip
router.post("/", verifyToken, async (req, res) => {
  try {
    const { itineraryName, destination, startDate, endDate, days, activities } = req.body;

    const newTrip = new Trip({
      user: req.user.id, // User ID from auth middleware
      itineraryName,
      destination,
      startDate,
      endDate,
      days,          // Store days array
      activities,    // Store activities object
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get all trips for the logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id });
    const currentTrips = trips.filter(trip => !trip.isPast);
    const pastTrips = trips.filter(trip => trip.isPast);
    res.json({ currentTrips, pastTrips });
  } catch (err) {
    res.status(500).json({ message: "Error fetching trips" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;
    const { itineraryName, destination, startDate, endDate, days, activities } = req.body;

    // Find the trip and ensure the logged-in user is the owner
    const trip = await Trip.findOne({ _id: tripId, user: userId });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found or unauthorized" });
    }

    // Update trip details
    trip.itineraryName = itineraryName;
    trip.destination = destination;
    trip.startDate = startDate;
    trip.endDate = endDate;
    trip.days = days;
    trip.activities = activities;

    await trip.save();
    res.json({ message: "Trip updated successfully", trip });
  } catch (err) {
    console.error("Error updating trip:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id; // Get logged-in user ID

    // Find the trip and check ownership
    const trip = await Trip.findOne({ _id: tripId, user: userId });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found or unauthorized" });
    }

    // Delete the trip
    await Trip.findByIdAndDelete(tripId);
    res.json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error("Error deleting trip:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
