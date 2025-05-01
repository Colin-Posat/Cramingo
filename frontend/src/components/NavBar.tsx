import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookIcon,
  BookmarkIcon,
  SearchIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  MessageCircleQuestionIcon,
  FolderIcon
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location]);

  const navItems = [
    { to: "/created-sets", icon: FolderIcon, label: "Created Sets" },
    { to: "/saved-sets", icon: BookmarkIcon, label: "Saved Sets" },
    { to: "/search-sets", icon: SearchIcon, label: "Search Sets" },
    { to: "/profile", icon: UserIcon, label: "Profile" },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleFeedback = () => setIsFeedbackOpen(!isFeedbackOpen);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#004a74] to-[#0060a1] text-white z-50 h-16 shadow-lg">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between h-full px-6 w-full">
          <Link to="/created-sets" className="transition-all duration-300 transform hover:scale-105 flex items-center">
            <div className="flex items-center justify-center bg-white bg-opacity-20 rounded-full h-11 w-12 shadow-inner backdrop-blur-sm">
              <img 
                src="/images/fliply_logo.png" 
                alt="Fliply Logo" 
                className="h-9 w-auto"
              />
            </div>
            <span className="ml-3 font-bold text-lg tracking-wide"></span>
          </Link>
          
          <div className="flex items-center justify-center">
            {navItems.map(item => {
              const isActive = activeTab === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-4 py-2 flex items-center gap-2 transition-all duration-300 mx-2 md:mx-3 lg:mx-4 
                    hover:bg-white hover:bg-opacity-10 rounded-lg 
                    ${isActive ? 'font-medium shadow-sm' : 'font-normal'}`}
                  onClick={() => setActiveTab(item.to)}
                >
                  <div className={`absolute inset-0 ${isActive ? 'opacity-100' : 'opacity-0'} bg-white bg-opacity-10 rounded-lg backdrop-blur-sm hover:opacity-20 transition-opacity`}></div>
                  <div className="z-10 flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-200'} transition-colors`} />
                    <span className={`${isActive ? 'font-medium' : ''} transition-all whitespace-nowrap`}>
                      {item.label}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
          
          <button
            onClick={toggleFeedback}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:bg-opacity-10 transition-all duration-200"
            aria-label="Give Feedback"
          >
            <MessageCircleQuestionIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between h-full px-4">
          <Link to="/created-sets" className="flex items-center">
            <div className="flex items-center justify-center bg-white bg-opacity-15 rounded-full h-10 w-10 shadow-inner">
              <img 
                src="/images/fliply_logo.png" 
                alt="Fliply Logo" 
                className="h-8 w-auto"
              />
            </div>
            <span className="ml-2 font-bold text-base">Fliply</span>
          </Link>
          <div className="flex items-center">
            <button 
              onClick={toggleFeedback} 
              className="p-2 mr-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors" 
              aria-label="Give Feedback"
            >
              <MessageCircleQuestionIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={toggleMenu} 
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
            >
              {isMenuOpen
                ? <XIcon className="w-6 h-6" />
                : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Slide in from right */}
      <div 
        className={`md:hidden fixed top-16 right-0 w-64 h-screen bg-gradient-to-b from-[#004a74] to-[#00659f] z-40 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col py-3">
          {navItems.map(item => {
            const isActive = activeTab === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  setActiveTab(item.to);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-5 py-3.5 transition-all duration-200
                  ${isActive 
                    ? 'bg-white bg-opacity-10 border-l-4 border-white shadow-inner' 
                    : 'border-l-4 border-transparent hover:bg-white hover:bg-opacity-5'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-200'}`} />
                <span className={`text-white ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30 animate-fadeIn"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Feedback Modal Component */}
      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Space for fixed navbar is handled by your page layout */}
    </>
  );
};

// Add this to your CSS or tailwind.config.js to ensure proper animations
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// .animate-fadeIn {
//   animation: fadeIn 0.3s ease-in-out;
// }

export default NavBar;