import React from 'react';
import { X, Mail } from "lucide-react";

// Contact Popup Component with TypeScript interface
interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactPopup: React.FC<ContactPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const openEmailClient = () => {
    const subject = ""
    const body = ""
    const mailtoUrl = `mailto:fliply.help@gmail.com?subject=${subject}&body=${body}`;
    
    // Open in a new tab
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="relative z-10 bg-gradient-to-b from-[#004a74] to-[#003152] 
                p-8 rounded-2xl border border-white/20 shadow-xl max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-2">Contact Us</h2>

        <h3 className="text-l font-bold text-white/70 mb-6">Any Questions or Suggestions?</h3>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <Mail className="text-blue-300 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-white font-medium">Email</h3>
              <p className="text-white/70">fliply.help@gmail.com</p>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={openEmailClient}
              className="w-full bg-blue-500/70 hover:bg-blue-600/70 text-white font-medium
                    py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              Send Us an Email
            </button>
            
            <p className="text-white/60 text-sm mt-3 text-center">
            Click the button above to open your email app with our email already filled in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPopup;