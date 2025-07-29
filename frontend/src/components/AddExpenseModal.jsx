import React, { useState } from "react";
import axios from "axios";


const AddExpenseModal = ({ onClose, onSave }) => {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState({
    member1: false,
    member2: false,
    member3: false,
  });
  const [paidBy, setPaidBy] = useState("Your Name"); // Automatically set to your name
  const [category, setCategory] = useState("");


  const handleSave = async () => {
    try {
      const expense = {
        date,
        description,
        amount,
        members,
        paidBy,
        category,
      };
  
      // ✅ Save expense in the backend
      const response = await axios.post("http://localhost:5000/api/expenses", expense, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      // ✅ Pass the new expense to Expenses.jsx
      onSave(response.data);
  
      // ✅ Close modal after saving
      onClose();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Failed to save expense.");
    }
  };
  

  const handleMemberChange = (e) => {
    const { name, checked } = e.target;
    setMembers((prevMembers) => ({
      ...prevMembers,
      [name]: checked,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Date:</label>
          <input
            type="date"
            className="w-full border-gray-300 rounded-md"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description:</label>
          <input
            type="text"
            className="w-full border-gray-300 rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Amount:</label>
          <input
            type="number"
            className="w-full border-gray-300 rounded-md"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Category:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`${
                category === "Food" ? "bg-blue-500 text-white" : "bg-gray-200"
              } px-4 py-2 rounded-md`}
              onClick={() => setCategory("Food")}
            >
              Food
            </button>
            <button
              className={`${
                category === "Travel" ? "bg-blue-500 text-white" : "bg-gray-200"
              } px-4 py-2 rounded-md`}
              onClick={() => setCategory("Travel")}
            >
              Travel
            </button>
            <button
              className={`${
                category === "Accommodation"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } px-4 py-2 rounded-md`}
              onClick={() => setCategory("Accommodation")}
            >
              Accommodation
            </button>
            <button
              className={`${
                category === "Other" ? "bg-blue-500 text-white" : "bg-gray-200"
              } px-4 py-2 rounded-md`}
              onClick={() => setCategory("Other")}
            >
              Other
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Members:</label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="member1"
                checked={members.member1}
                onChange={handleMemberChange}
                id="member1"
              />
              <label htmlFor="member1" className="ml-2">
                Member 1
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="member2"
                checked={members.member2}
                onChange={handleMemberChange}
                id="member2"
              />
              <label htmlFor="member2" className="ml-2">
                Member 2
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="member3"
                checked={members.member3}
                onChange={handleMemberChange}
                id="member3"
              />
              <label htmlFor="member3" className="ml-2">
                Member 3
              </label>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Paid By:</label>
          <input
            type="text"
            className="w-full bg-gray-200 text-gray-500 px-4 py-2 rounded-md"
            value={paidBy}
            readOnly
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
