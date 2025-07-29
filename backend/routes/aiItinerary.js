import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ✅ AI Itinerary Generation Using Gemini AI
router.post("/generate", async (req, res) => {
  const { destination, startDate, endDate } = req.body;

  if (!destination || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const numDays = calculateDays(startDate, endDate);

  try {
    const prompt = `
Create a ${numDays}-day travel itinerary for ${destination}.
Each day should have 3 short activities: morning, afternoon, and evening.

Respond ONLY in this strict JSON format:
{
  "days": ["Day 1", "Day 2", "Day 3"],
  "activities": {
    "Day 1": ["Morning: ...", "Afternoon: ...", "Evening: ..."],
    ...
  }
}

No explanation. No markdown. Only JSON.
`;

    // 🔹 Call Gemini AI API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const aiGeneratedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanedText = aiGeneratedText.replace(/```json|```/g, "").trim();

    let parsedItinerary;
    try {
      parsedItinerary = JSON.parse(cleanedText);
    } catch (error) {
      console.error("⚠️ AI Response is not in JSON format:", cleanedText);
      return res.status(500).json({ message: "AI response format is incorrect", rawResponse: cleanedText });
    }

    res.json(parsedItinerary);

  } catch (error) {
    console.error("❌ Gemini AI API Error:", error.response ? error.response.data : error.message);

    // ✅ Fallback to dummy data if Gemini fails
    const dummyResponse = {
      days: ["Day 1", "Day 2", "Day 3"],
      activities: {
        "Day 1": [
          "Morning: Visit Gateway of India",
          "Afternoon: Explore Marine Drive",
          "Evening: Street food at Chowpatty"
        ],
        "Day 2": [
          "Morning: Boat ride to Elephanta Caves",
          "Afternoon: Visit Prince of Wales Museum",
          "Evening: Shopping at Colaba Causeway"
        ],
        "Day 3": [
          "Morning: Relax at Juhu Beach",
          "Afternoon: Tour Film City",
          "Evening: Dinner at a rooftop restaurant"
        ]
      }
    };

    return res.status(200).json(dummyResponse);
  }
});

// ✅ Function to Calculate Number of Days
const calculateDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max((endDate - startDate) / (1000 * 60 * 60 * 24), 1);
};

export default router;



// import express from "express";
// import axios from "axios";
// import dotenv from "dotenv";

// dotenv.config();

// const router = express.Router();

// // ✅ AI Itinerary Generation Using Gemini AI
// router.post("/generate", async (req, res) => {
//   const { destination, startDate, endDate } = req.body;

//   if (!destination || !startDate || !endDate) {
//     return res.status(400).json({ message: "Missing required fields." });
//   }

//   const numDays = calculateDays(startDate, endDate);

//   try {
//     const prompt = `
// Create a ${numDays}-day travel itinerary for ${destination}.
// Each day should have 3 short activities: morning, afternoon, and evening.

// Respond ONLY in this strict JSON format:
// {
//   "days": ["Day 1", "Day 2", "Day 3"],
//   "activities": {
//     "Day 1": ["Morning: ...", "Afternoon: ...", "Evening: ..."],
//     ...
//   }
// }

// No explanation. No markdown. Only JSON.
// `;


//     // 🔹 Call Gemini AI API (Correct Format)
//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         contents: [{ role: "user", parts: [{ text: prompt }] }]
//       },
//       {
//         headers: { "Content-Type": "application/json" }
//       }
//     );

//     // ✅ Extract and parse AI response correctly
//     const aiGeneratedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
//     const cleanedText = aiGeneratedText.replace(/```json|```/g, "").trim();

//     let parsedItinerary;
//     try {
//       parsedItinerary = JSON.parse(cleanedText); // Parse only if it's valid JSON
//     } catch (error) {
//       console.error("⚠️ AI Response is not in JSON format:", cleanedText);
//       return res.status(500).json({ message: "AI response format is incorrect", rawResponse: cleanedText});
//     }

//     res.json(parsedItinerary);
//   } catch (error) {
//     console.error("❌ Gemini AI API Error:", error.response ? error.response.data : error.message);
//     res.status(500).json({
//       message: "Failed to generate AI itinerary.",
//       error: error.response ? error.response.data : error.message,
//     });
//   }
// });

// // ✅ Function to Calculate Number of Days
// const calculateDays = (start, end) => {
//   const startDate = new Date(start);
//   const endDate = new Date(end);
//   return Math.max((endDate - startDate) / (1000 * 60 * 60 * 24), 1);
// };

// export default router;
