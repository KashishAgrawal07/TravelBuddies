import dotenv from 'dotenv';
import express from 'express';
import connectDB from './db.js'; // Import the database connection
import path from 'path';
import cors from 'cors'; // Import cors package
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import expenseRoutes from './routes/expenseRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import aiItineraryRoutes from "./routes/aiItinerary.js";

dotenv.config(); // Load environment variables

const app = express();

app.use(cors()); // Enable CORS for all domains (or configure to restrict)
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Middleware
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes); // Register the trips route
app.use("/api/expenses", expenseRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use("/api/itinerary", aiItineraryRoutes);

// Store io instance in app
app.set('io', io);

// ✅ Enhanced Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  // ✅ Handle joining trip rooms
  socket.on('joinTripRoom', (tripCode) => {
    socket.join(tripCode);
    console.log(`👥 User ${socket.id} joined trip room: ${tripCode}`);
    
    // Notify others in the room that someone joined
    socket.to(tripCode).emit('userConnected', { 
      message: `A user joined the trip ${tripCode}`,
      socketId: socket.id 
    });
  });

  // ✅ Handle leaving trip rooms
  socket.on('leaveTripRoom', (tripCode) => {
    socket.leave(tripCode);
    console.log(`👋 User ${socket.id} left trip room: ${tripCode}`);
    
    // Notify others in the room that someone left
    socket.to(tripCode).emit('userDisconnected', { 
      message: `A user left the trip ${tripCode}`,
      socketId: socket.id 
    });
  });

  // ✅ Handle trip creation (updated to use rooms properly)
  socket.on('tripCreated', (trip) => {
    console.log(`📋 Trip created: ${trip.tripCode}`);
    // Join the creator to their own trip room
    socket.join(trip.tripCode);
    // Broadcast to the specific trip room
    socket.to(trip.tripCode).emit('tripUpdated', trip);
  });

  // ✅ Handle user joining trip (enhanced)
  socket.on("tripJoined", ({ tripCode, username }) => {
    console.log(`👤 ${username} joined trip: ${tripCode}`);
    
    // Join the user to the trip room
    socket.join(tripCode);
    
    // Notify all users in the trip room (including the joiner)
    io.to(tripCode).emit("userJoinedNotification", { tripCode, username });
  });

  // ✅ Handle real-time itinerary updates (enhanced)
  socket.on('itineraryUpdated', (data) => {
    const { tripCode, days, activities, updatedBy } = data;
    console.log(`📝 Itinerary updated for trip ${tripCode} by user ${updatedBy || 'unknown'}`);

    // Send update only to users in the same trip room, excluding the sender
    socket.to(tripCode).emit('itineraryUpdated', { 
      tripCode, 
      days, 
      activities, 
      updatedBy,
      timestamp: new Date().toISOString()
    });
  });

  // ✅ Handle manual itinerary sync requests
  socket.on('requestItinerarySync', (tripCode) => {
    console.log(`🔄 Itinerary sync requested for trip: ${tripCode}`);
    // This can be used if a user wants to manually sync
    socket.to(tripCode).emit('syncRequested', { tripCode });
  });

  // ✅ Handle typing indicators (optional feature)
  socket.on('userTyping', ({ tripCode, username, isTyping }) => {
    socket.to(tripCode).emit('userTyping', { username, isTyping });
  });

  // ✅ Handle user presence updates
  socket.on('updatePresence', ({ tripCode, username, status }) => {
    socket.to(tripCode).emit('presenceUpdated', { username, status });
  });

  // ✅ Enhanced disconnect handler
  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
    
    // Optional: You can track which rooms the user was in and notify others
    // This would require maintaining a user-room mapping
  });

  // ✅ Error handling
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// ✅ Add connection error handling
io.engine.on("connection_error", (err) => {
  console.error("❌ Socket.IO connection error:", err.req);
  console.error("❌ Error code:", err.code);
  console.error("❌ Error message:", err.message);
  console.error("❌ Error context:", err.context);
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 Socket.IO server is ready for connections`);
});