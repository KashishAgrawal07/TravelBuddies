import mongoose from "mongoose";
const CollaborationSchema = new mongoose.Schema(
  {
    tripName: {
      type: String,
      required: true,
    },
    tripCode: {
      type: String,
      required: true,
      unique: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // ✅ Add these fields for itinerary storage
    days: {
      type: [String], // Store day names (e.g., ["Day 1", "Day 2"])
      default: [],
    },
    activities: {
      type: Map, // Store activities per day
      of: [String], // Each day will have an array of activities
      default: {},
    },
  },
  { timestamps: true }
);
const Collaboration = mongoose.model("Collaboration", CollaborationSchema);
export default Collaboration;
