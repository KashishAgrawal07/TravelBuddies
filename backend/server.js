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


io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('tripCreated', (trip) => {
    io.emit('tripCreated', trip); // Notify all users
  });

  socket.on("tripJoined", ({ tripCode, username }) => {
    console.log(`${username} joined trip: ${tripCode}`);

    socket.join(tripCode);
    io.to(tripCode).emit("userJoinedNotification", { tripCode, username });
  });

  // ✅ Handle real-time itinerary updates
  socket.on('itineraryUpdated', (data) => {
    const { tripCode, days, activities } = data;
    console.log(`Itinerary updated for trip ${tripCode}`);

    // ✅ Send update only to users in the same trip
    io.to(tripCode).emit('itineraryUpdated', { tripCode, days, activities });
  });


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



