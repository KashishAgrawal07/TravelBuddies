import React, { useState } from "react";
//import { link } from "../../../backend/routes/auth";


const DropDownTrips = ({ currentTrips, pastTrips }) => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      {/* Current Trips */}
      <div className="border border-gray-300 rounded-lg mb-2 text-black">
        <button
          className="dropdown-btn"
          onClick={() => toggleSection("current")}
          
        >
          Current Trips
          <span
            className={`${
              openSection === "current" ? "rotate-180" : ""
            } transition-transform`}
          >
            ▼
          </span>
        </button>
        {openSection === "current" && (
          <div className="dropdown-content">
            {currentTrips.length > 0 ? (
              currentTrips.map((trip) => (
                <div key={trip._id} className="p-2 border-b border-gray-300">
                  <h3 className="font-bold">{trip.name}</h3>
                  <p className="text-black-500">{trip.destination}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No current trips found.</p>
            )}
          </div>
        )}
      </div>

      {/* Past Trips */}
      <div className="border border-gray-300 rounded-lg text-black">
        <button
          className="dropdown-header"
          onClick={() => toggleSection("past")}
        >
          Past Trips
          <span
            className={`${
              openSection === "past" ? "rotate-180" : ""
            } transition-transform`}
          >
            ▼
          </span>
        </button>
        {openSection === "past" && (
          <div className="dropdown-content">
            {pastTrips.length > 0 ? (
              pastTrips.map((trip) => (
                <div key={trip._id} className="p-2 border-b border-gray-300">
                  <h3 className="font-bold">{trip.name}</h3>
                  <p className="text-gray-600">{trip.destination}</p>
                </div>
              ))
            ) : (
              <p className="text-black-500">No past trips found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropDownTrips;
