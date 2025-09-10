import { useState, useEffect } from 'react';
import { X, Users, Calculator, Receipt } from 'lucide-react';

const AddExpenseModal = ({ isOpen, onClose, onSave, editingExpense = null, friends = [] }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    paidBy: '',
    splitAmong: [],
    splitType: 'equal',
    splitDetails: []
  });

  const [errors, setErrors] = useState({});

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Travel',
    'Healthcare',
    'Education',
    'Other'
  ];

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        amount: editingExpense.amount.toString(),
        category: editingExpense.category,
        description: editingExpense.description,
        paidBy: editingExpense.paidBy._id || editingExpense.paidBy,
        splitAmong: editingExpense.splitAmong.map(user => user._id || user),
        splitType: editingExpense.splitType || 'equal',
        splitDetails: editingExpense.splitDetails || []
      });
    } else {
      // Reset form for new expense
      setFormData({
        amount: '',
        category: categories[0],
        description: '',
        paidBy: '',
        splitAmong: [],
        splitType: 'equal',
        splitDetails: []
      });
    }
  }, [editingExpense, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSplitAmongChange = (userId) => {
    setFormData(prev => {
      const newSplitAmong = prev.splitAmong.includes(userId)
        ? prev.splitAmong.filter(id => id !== userId)
        : [...prev.splitAmong, userId];
      
      // Recalculate split details if equal split
      let newSplitDetails = prev.splitDetails;
      if (prev.splitType === 'equal' && prev.amount) {
        const sharePerPerson = parseFloat(prev.amount) / newSplitAmong.length;
        newSplitDetails = newSplitAmong.map(id => ({
          user: id,
          amount: sharePerPerson
        }));
      }
      
      return {
        ...prev,
        splitAmong: newSplitAmong,
        splitDetails: newSplitDetails
      };
    });
  };

  const handleSplitDetailChange = (userId, amount) => {
    setFormData(prev => ({
      ...prev,
      splitDetails: prev.splitDetails.map(detail =>
        detail.user === userId ? { ...detail, amount: parseFloat(amount) || 0 } : detail
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }
    
    if (!formData.paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }
    
    if (formData.splitAmong.length === 0) {
      newErrors.splitAmong = 'Please select at least one person to split with';
    }
    
    if (formData.splitType === 'exact') {
      const total = formData.splitDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
      if (Math.abs(total - parseFloat(formData.amount)) > 0.01) {
        newErrors.splitDetails = 'Split amounts must equal the total expense';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      await onSave(expenseData);
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      setErrors({ submit: 'Failed to save expense. Please try again.' });
    }
  };

  if (!isOpen) return null;

  const totalSplitAmount = formData.splitDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter expense description"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Who Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who paid? *
            </label>
            <select
              name="paidBy"
              value={formData.paidBy}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.paidBy ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select who paid</option>
              <option value="current_user">You</option>
              {friends.map(friend => (
                <option key={friend._id} value={friend._id}>{friend.name}</option>
              ))}
            </select>
            {errors.paidBy && <p className="text-red-500 text-sm mt-1">{errors.paidBy}</p>}
          </div>

          {/* Split Among */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Split among *
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.splitAmong.includes('current_user')}
                  onChange={() => handleSplitAmongChange('current_user')}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span>You</span>
              </label>
              {friends.map(friend => (
                <label key={friend._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.splitAmong.includes(friend._id)}
                    onChange={() => handleSplitAmongChange(friend._id)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span>{friend.name}</span>
                </label>
              ))}
            </div>
            {errors.splitAmong && <p className="text-red-500 text-sm mt-1">{errors.splitAmong}</p>}
          </div>

          {/* Split Type */}
          {formData.splitAmong.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Split type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="splitType"
                    value="equal"
                    checked={formData.splitType === 'equal'}
                    onChange={handleInputChange}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <span>Split equally</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="splitType"
                    value="exact"
                    checked={formData.splitType === 'exact'}
                    onChange={handleInputChange}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <span>Enter exact amounts</span>
                </label>
              </div>
            </div>
          )}

          {/* Exact Split Details */}
          {formData.splitType === 'exact' && formData.splitAmong.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter amounts for each person
              </label>
              <div className="space-y-2">
                {formData.splitAmong.map(userId => {
                  const user = userId === 'current_user' ? { name: 'You' } : friends.find(f => f._id === userId);
                  const detail = formData.splitDetails.find(d => d.user === userId) || { amount: 0 };
                  
                  return (
                    <div key={userId} className="flex items-center space-x-3">
                      <span className="w-20 text-sm">{user?.name}</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={detail.amount}
                          onChange={(e) => handleSplitDetailChange(userId, e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Total: ₹{totalSplitAmount.toFixed(2)} / ₹{formData.amount || '0.00'}
                {formData.amount && Math.abs(totalSplitAmount - parseFloat(formData.amount)) > 0.01 && (
                  <span className="text-red-500 ml-2">
                    (Difference: ₹{Math.abs(totalSplitAmount - parseFloat(formData.amount)).toFixed(2)})
                  </span>
                )}
              </div>
              {errors.splitDetails && <p className="text-red-500 text-sm mt-1">{errors.splitDetails}</p>}
            </div>
          )}

          {/* Equal Split Preview */}
          {formData.splitType === 'equal' && formData.splitAmong.length > 0 && formData.amount && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Each person pays: ₹{(parseFloat(formData.amount) / formData.splitAmong.length).toFixed(2)}
              </p>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-500 text-sm">{errors.submit}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;