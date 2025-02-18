import React, { useState } from 'react';
import { supabase } from '../services/auth';

interface ResetPasswordPopupProps {
  onClose: () => void;
}

const ResetPasswordPopup: React.FC<ResetPasswordPopupProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password updated successfully.');
      setTimeout(onClose, 2000);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white p-6 rounded-lg shadow-lg text-center"
      >
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        {message && <p className="mb-2 text-sm text-red-500">{message}</p>}
        <form onSubmit={handleResetPassword} className="flex flex-col space-y-3">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
          >
            Reset Password
          </button>
        </form>
        <button 
          onClick={onClose} 
          className="mt-4 underline text-blue-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPopup;
