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
    // ✅ Fixed: Use Object instead of Map for better compatibility
    days: {
      type: [String], // Store day names (e.g., ["Day 1", "Day 2"])
      default: [],
    },
    activities: {
      type: mongoose.Schema.Types.Mixed, // ✅ Use Mixed type instead of Map
      default: {},
    },
  },
  { timestamps: true }
);

const Collaboration = mongoose.model("Collaboration", CollaborationSchema);
export default Collaboration;