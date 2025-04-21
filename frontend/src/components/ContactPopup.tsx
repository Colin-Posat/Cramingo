import React, { useState } from 'react';
import { X, Mail, Phone, MapPin } from "lucide-react";

// Contact Popup Component with TypeScript interface
interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactPopup: React.FC<ContactPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
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
        
        <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <Mail className="text-blue-300 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-white font-medium">Email</h3>
              <p className="text-white/70">support@fliply.edu</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <Phone className="text-blue-300 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-white font-medium">Phone</h3>
              <p className="text-white/70">(555) 123-4567</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <MapPin className="text-blue-300 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-white font-medium">Address</h3>
              <p className="text-white/70">
                123 Education Ave<br />
                Suite 400<br />
                San Francisco, CA 94110
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <form className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Your Name" 
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg 
                         text-white placeholder-white/50 focus:outline-none focus:border-blue-400/70"
              />
            </div>
            <div>
              <input 
                type="email" 
                placeholder="Your Email" 
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg 
                         text-white placeholder-white/50 focus:outline-none focus:border-blue-400/70"
              />
            </div>
            <div>
              <textarea 
                placeholder="Your Message" 
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg 
                         text-white placeholder-white/50 focus:outline-none focus:border-blue-400/70"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-500/70 hover:bg-blue-600/70 text-white font-medium 
                      py-3 rounded-lg transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPopup;