import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface AccountFoundPopupProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const AccountFoundPopup: React.FC<AccountFoundPopupProps> = ({ isOpen, onClose, email }) => {
  const [closing, setClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Reset states when popup opens
  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setIsLoading(true);
      setSuccess(false);
    }
  }, [isOpen]);
  
  // Auto-close after loading is complete
  useEffect(() => {
    if (isOpen && !closing) {
      // Start loading immediately when popup opens
      setIsLoading(true);
      
      // Set a timeout to show the success state first
      const loadingTime = Math.floor(Math.random() * (7000 - 5000 + 1)) + 5000; // Random time between 5-7 seconds
      
      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
        setSuccess(true);
        
        // Wait a moment to show the success state before closing
        const successTimer = setTimeout(() => {
          setClosing(true);
          
          // Wait for closing animation before actually calling onClose
          setTimeout(onClose, 500);
        }, 1500); // Show success state for 1.5 seconds
        
        return () => clearTimeout(successTimer);
      }, loadingTime);
      
      // Clear timeout if component unmounts
      return () => clearTimeout(loadingTimer);
    }
  }, [isOpen, onClose, closing]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Popup Content */}
      <div 
        className={`bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative z-10 ${
          closing ? 'animate-scaleOut' : 'animate-scaleIn'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            {isLoading ? (
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Existing Account Found!
          </h3>
          
          <p className="text-gray-600 mb-6">
            We found an existing account with <span className="font-medium">{email}</span>.
            {isLoading ? " Logging you in automatically..." : " You've been successfully logged in."}
          </p>
          
          {isLoading && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div className="bg-green-600 h-2 rounded-full animate-progress"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add CSS for animations
const popupAnimations = `
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scaleIn {
  animation: scaleIn 0.2s ease-out forwards;
}

@keyframes scaleOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
}
.animate-scaleOut {
  animation: scaleOut 0.5s ease-in forwards;
}

@keyframes progress {
  0% { width: 0%; }
  10% { width: 10%; }
  20% { width: 25%; }
  50% { width: 60%; }
  80% { width: 80%; }
  100% { width: 100%; }
}
.animate-progress {
  animation: progress 6s ease-in-out forwards;
}
`;

// Add the animation styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = popupAnimations;
  document.head.appendChild(style);
}

export default AccountFoundPopup;