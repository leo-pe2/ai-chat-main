import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmDeletePopupProps {
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeletePopup: React.FC<ConfirmDeletePopupProps> = ({ chatTitle, onConfirm, onCancel }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-black">
        <h2 className="text-xl font-bold mb-4">Delete Chat</h2>
        <p className="mb-4">
          Are you sure you want to delete the chat: <span className="font-semibold">{chatTitle}</span>?
        </p>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors duration-300"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDeletePopup;
