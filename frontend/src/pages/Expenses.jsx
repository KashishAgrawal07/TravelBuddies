import { useState, useEffect } from "react";
import axios from "axios";
import AddExpenseModal from "../components/AddExpenseModal";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);
  const [expenseBreakdown, setExpenseBreakdown] = useState({});

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/expenses")
      .then((res) => {
        setExpenses(res.data);
        calculateBalances(res.data);
      })
      .catch((err) => console.error(err));
  }, []);
  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No auth token found!");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/expenses/breakdown", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Breakdown data received:", response.data);
        setExpenseBreakdown(response.data);
      } catch (err) {
        console.error("Error fetching breakdown:", err);
      }
    };
  
    fetchBreakdown();
  }, []);

  const calculateBalances = (expenses) => {
    let owe = 0,
      owed = 0;

    expenses.forEach((expense) => {
      const splitAmong = Array.isArray(expense.splitAmong) ? expense.splitAmong : [];

      if (expense.paidBy === "You") {
        if (splitAmong.length > 1) {
          const amountOwedByOthers = expense.amount - (splitAmong.includes("You") ? expense.amount / splitAmong.length : 0);
          owed += amountOwedByOthers;
        }
      } else {
        if (splitAmong.includes("You")) {
          owe += expense.amount / splitAmong.length;
        }
      }
    });

    setYouOwe(owe);
    setYouAreOwed(owed);
    setTotalBalance(owed - owe);
  };

  const handleSaveExpense = (newExpense) => {
    setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
    calculateBalances([...expenses, newExpense]);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
  };

  const deleteExpense = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      axios
        .delete(`http://localhost:5000/api/expenses/${id}`)
        .then(() => {
          setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense._id !== id));
          calculateBalances(expenses.filter((expense) => expense._id !== id));
        })
        .catch((err) => console.error(err));
    }
  };

  return (
    <div className="p-6 font-mono bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Expenses</h1>

      {/* Top Summary Section */}
      <div className="flex justify-between bg-white p-4 rounded shadow-md mb-4">
        <div className="text-center">
          <p className="text-gray-600">You owe</p>
          <p className="text-red-500 font-semibold">₹{youOwe.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600">You are owed</p>
          <p className="text-green-500 font-semibold">₹{youAreOwed.toFixed(2)}</p>
        </div>
      </div>

      {/* Add Expense Button */}
      <button className="bg-orange-500 text-white px-4 py-2 rounded" onClick={() => setModalOpen(true)}>
        + Add Expense
      </button>

      {modalOpen && <AddExpenseModal onClose={handleCloseModal} onSave={handleSaveExpense} />}

      {/* Expenses List */}
      <div className="bg-white p-4 rounded shadow-md mt-4">
        <h2 className="text-lg font-semibold mb-4">Expense List</h2>
        {expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          <ul>
            {expenses.map((expense) => (
              <li key={expense._id} className="flex justify-between items-center border-b py-2">
                <div>
                  <span className="font-semibold">{expense.date}</span>
                  <p className="text-sm text-gray-500">{expense.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={expense.paidBy === "You" ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                    ₹{expense.paidBy === "You" ? expense.amount : (expense.amount / 4).toFixed(2)}
                  </span>
                  <button className="bg-blue-500 text-white px-2 py-1 rounded text-sm" onClick={() => handleEditExpense(expense)}>
                    Edit
                  </button>
                  <button className="bg-red-600 text-white px-2 py-1 rounded text-sm" onClick={() => deleteExpense(expense._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expense Breakdown Section */}
<div className="bg-white p-4 rounded shadow-md mt-4">
  <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
  {Object.keys(expenseBreakdown).length === 0 ? (
    <p>No balances yet.</p>
  ) : (
    <ul>
      {Object.entries(expenseBreakdown).map(([user, amount]) => (
        <li key={user} className="border-b py-2 flex justify-between">
          <span className="font-semibold">{user}</span>
          <span className={amount < 0 ? "text-red-500" : "text-green-500"}>
            {amount < 0 ? `Owes ₹${Math.abs(amount)}` : `Receives ₹${amount}`}
          </span>
        </li>
      ))}
    </ul>
  )}
</div>

      {/* Balances Section */}
      <div className="bg-white p-4 rounded shadow-md mt-4">
        <h2 className="text-lg font-semibold mb-4">Balances</h2>
        <div className="flex justify-between">
          <div className="text-red-500 font-semibold">You owe: ₹{youOwe.toFixed(2)}</div>
          <div className="text-green-500 font-semibold">You are owed: ₹{youAreOwed.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
