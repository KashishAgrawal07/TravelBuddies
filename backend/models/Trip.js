import mongoose from "mongoose";

const TripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itineraryName: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: [{ type: String, required: true }],  // ✅ Ensure days are stored correctly
  activities: { 
    type: Map, 
    of: [String], 
    default: {}  // ✅ Default empty object to prevent storage issues
  },
});

// Virtual field to check if the trip is in the past
TripSchema.virtual("isPast").get(function () {
  return new Date() > this.endDate; // Returns true if endDate is in the past
});

const Trip = mongoose.model("Trip", TripSchema);

export default Trip;
