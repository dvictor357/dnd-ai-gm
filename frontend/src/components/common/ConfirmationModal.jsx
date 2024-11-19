import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl transform transition-all">
        <div className="text-center">
          <h3 className="text-lg font-medium leading-6 text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-300 mb-6">
            {message}
          </p>
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 rounded-md transition-colors"
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
