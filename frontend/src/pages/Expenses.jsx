import { useState, useEffect } from "react";
import { Plus, Users, TrendingUp, TrendingDown, Receipt, Calendar, Edit, Trash2, DollarSign } from "lucide-react";
import AddExpenseModal from "../components/AddExpenseModal";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [friends, setFriends] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('expenses');
  const [summary, setSummary] = useState({
    totalOwed: 0,
    totalOwing: 0,
    netBalance: 0
  });

  // Mock friends data - replace with actual API call to your existing user system
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // Replace this with your existing friends/users API endpoint
        // For now using mock data, but you can integrate with your existing user system
        const mockFriends = [
          { _id: 'friend1', name: 'Alice Johnson', email: 'alice@example.com' },
          { _id: 'friend2', name: 'Bob Smith', email: 'bob@example.com' },
          { _id: 'friend3', name: 'Charlie Brown', email: 'charlie@example.com' }
        ];
        setFriends(mockFriends);
        
        // TODO: Replace with actual API call to your existing system:
        // const token = localStorage.getItem("token");
        // const response = await fetch("YOUR_EXISTING_FRIENDS_ENDPOINT", {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const friendsData = await response.json();
        // setFriends(friendsData);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    
    fetchFriends();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const fetchBalances = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/expenses/balances", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setBalances(data);
      
      // Calculate summary
      let totalOwed = 0;
      let totalOwing = 0;
      
      data.forEach(balance => {
        if (balance.status === 'owes_you') {
          totalOwed += balance.balance;
        } else {
          totalOwing += Math.abs(balance.balance);
        }
      });
      
      setSummary({
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const fetchCategoryBreakdown = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/expenses/breakdown", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCategoryBreakdown(data);
    } catch (error) {
      console.error("Error fetching breakdown:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchExpenses(),
        fetchBalances(),
        fetchCategoryBreakdown()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleSaveExpense = async (expenseData) => {
    try {
      const token = localStorage.getItem("token");
      const url = editingExpense 
        ? `http://localhost:5000/api/expenses/${editingExpense._id}`
        : "http://localhost:5000/api/expenses";
      
      const method = editingExpense ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(expenseData)
      });

      if (response.ok) {
        await fetchExpenses();
        await fetchBalances();
        await fetchCategoryBreakdown();
        setModalOpen(false);
        setEditingExpense(null);
      } else {
        throw new Error('Failed to save expense');
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      throw error;
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          await fetchExpenses();
          await fetchBalances();
          await fetchCategoryBreakdown();
        }
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }
  };

  const handleSettleUp = async (otherUserId, amount) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/expenses/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId, amount })
      });

      if (response.ok) {
        await fetchBalances();
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Error settling up:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getUserName = (userId) => {
    if (userId === 'current_user') return 'You';
    const friend = friends.find(f => f._id === userId);
    return friend ? friend.name : 'Unknown User';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Expenses</h1>
            <p className="text-gray-600">Track and split expenses with friends</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 md:mt-0 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">You are owed</p>
                <p className="text-2xl font-bold text-green-600">₹{summary.totalOwed.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">You owe</p>
                <p className="text-2xl font-bold text-red-600">₹{summary.totalOwing.toFixed(2)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Net Balance</p>
                <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{summary.netBalance.toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${summary.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`w-6 h-6 ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setSelectedTab('expenses')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'expenses'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Receipt className="w-4 h-4 inline mr-2" />
            All Expenses
          </button>
          <button
            onClick={() => setSelectedTab('balances')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'balances'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Balances
          </button>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'expenses' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No expenses added yet</p>
                  <p className="text-sm text-gray-500 mt-1">Add your first expense to get started</p>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Receipt className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(expense.date)}
                              </span>
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {expense.category}
                              </span>
                              <span>
                                Paid by {getUserName(expense.paidBy)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 ml-11">
                          Split among: {expense.splitAmong?.map(userId => getUserName(userId)).join(', ')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                          {expense.splitAmong?.includes('current_user') && (
                            <p className="text-sm text-gray-600">
                              Your share: ₹{(expense.amount / expense.splitAmong.length).toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {selectedTab === 'balances' && (
          <div className="space-y-6">
            {/* Friend Balances */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Friend Balances</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {balances.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No outstanding balances</p>
                    <p className="text-sm text-gray-500 mt-1">All settled up!</p>
                  </div>
                ) : (
                  balances.map((balance) => (
                    <div key={balance.userId} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {getUserName(balance.userId)?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{getUserName(balance.userId)}</h3>
                          <p className="text-sm text-gray-600">User ID: {balance.userId}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {balance.status === 'owes_you' ? (
                            <p className="text-green-600 font-semibold">
                              Owes you ₹{balance.balance.toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-red-600 font-semibold">
                              You owe ₹{Math.abs(balance.balance).toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleSettleUp(balance.userId, Math.abs(balance.balance))}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                        >
                          Settle Up
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.categoryBreakdown && Object.keys(categoryBreakdown.categoryBreakdown).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categoryBreakdown.categoryBreakdown).map(([category, data]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                        <p className="text-2xl font-bold text-gray-900">₹{data.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Your share: ₹{data.yourShare.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{data.count} expense{data.count !== 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Expense Modal */}
        <AddExpenseModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
          editingExpense={editingExpense}
          friends={friends}
        />
      </div>
    </div>
  );
};

export default Expenses;