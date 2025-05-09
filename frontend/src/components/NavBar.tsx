import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookmarkIcon,
  SearchIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  MessageCircleQuestionIcon,
  FolderIcon,
  ChevronRightIcon,
  LogOutIcon
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();

  // Handle scroll state for shadow effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Check if current route is one of the main section pages
  const isMainSection = [
    '/created-sets',
    '/saved-sets',
    '/search-sets',
    '/profile'
  ].some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));

  // For all OTHER pages that are NOT the main section pages
  const isOtherPage = !isMainSection;

  return (
    <>
      {/* Desktop - Left Sidebar - Only for main section pages */}
      {isMainSection && (
        <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-16 lg:w-52 bg-gradient-to-b from-[#004a74] to-[#0060a1] text-white z-50 shadow-xl transition-all duration-300 border-r border-white/10">
          {/* Logo area with refined alignment */}
          <div className="py-5 flex justify-center lg:justify-start lg:px-5">
            <Link to="/created-sets" className="transition-all duration-300 transform hover:scale-105 flex items-center">
              <div className="mt-1 flex items-center justify-center bg-white rounded-xl h-10 w-10 shadow-md">
                <img 
                  src="/images/cramingo_logo.png" 
                  alt="Fliply Logo" 
                  className="h-9 w-auto"
                />
              </div>
              <span className="mt-1 hidden lg:block ml-3 font-bold text-lg tracking-wide">Cramingo</span>
            </Link>
          </div>
          
          {/* Navigation Items with refined styling */}
          <div className="flex flex-col py-6 flex-grow space-y-1.5 px-3">
            {navItems.map(item => {
              const isActive = activeTab === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative py-3 transition-all duration-200 flex flex-col lg:flex-row items-center rounded-xl
                    ${isActive 
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30' 
                      : 'text-white/80 hover:bg-white/15 hover:text-white hover:backdrop-blur-sm'
                    }
                    group overflow-hidden`}
                  onClick={() => setActiveTab(item.to)}
                >
                  {/* Subtle gradient overlay for active item */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/0"></div>
                  )}
                  
                  {/* Light beam animation effect on hover */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                  
                  <div className={`z-10 flex items-center justify-center w-full lg:justify-start lg:px-4`}>
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10' : 'group-hover:bg-white/5'} transition-all duration-200`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''} transition-colors`} />
                    </div>
                    <span className={`hidden lg:block text-sm ml-3 ${isActive ? 'font-medium' : ''} transition-all`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="hidden lg:block ml-auto">
                        <ChevronRightIcon className="w-4 h-4 text-white/80" />
                      </div>
                    )}
                  </div>
                  
 
                </Link>
              );
            })}
          </div>
          
          {/* Feedback button at bottom */}
          <div className="py-4 border-t border-white/20 flex justify-center lg:px-4">
            <button
              onClick={toggleFeedback}
              className="flex flex-col lg:flex-row items-center justify-center lg:justify-start lg:gap-3 w-full py-2 lg:px-3 rounded-lg hover:bg-white/15 transition-all duration-200 group"
              aria-label="Give Feedback"
            >
              <div className="p-1.5 rounded-lg group-hover:bg-white/10 transition-all duration-200">
                <MessageCircleQuestionIcon className="w-5 h-5" />
              </div>
              <span className="hidden lg:block text-xs lg:text-sm">Feedback</span>
            </button>
          </div>

        </aside>
      )}

      {/* Mobile - Top Bar - For main section pages */}
      {isMainSection && (
        <nav className={`md:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-[#004a74] to-[#0060a1] text-white z-50 h-16 
          ${isScrolled ? 'shadow-lg' : ''} transition-all duration-300`}>
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center">
              <button 
                onClick={toggleMenu} 
                className="p-2.5 mr-3 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150"
                aria-label="Toggle menu"
              >
                {isMenuOpen
                  ? <XIcon className="w-6 h-6" />
                  : <MenuIcon className="w-6 h-6" />}
              </button>
              <Link to="/created-sets" className="flex items-center">
                <div className="flex items-center justify-center bg-white rounded-xl h-9 w-9 shadow-inner">
                  <img 
                    src="/images/cramingo_logo.png" 
                    alt="Fliply Logo" 
                    className="h-8 w-auto"
                  />
                </div>
                <span className="ml-3 font-bold text-lg tracking-wide">Cramingo</span>
              </Link>
            </div>
            <button 
              onClick={toggleFeedback} 
              className="p-2.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150" 
              aria-label="Give Feedback"
            >
              <MessageCircleQuestionIcon className="w-6 h-6" />
            </button>
          </div>
        </nav>
      )}

      {/* Navigation Bar for ALL OTHER PAGES (not main section) - Both Mobile and Desktop */}
      {isOtherPage && (
        <nav className={`fixed top-0 left-0 right-0 bg-gradient-to-r from-[#004a74] to-[#0060a1] text-white z-50 h-16 
          ${isScrolled ? 'shadow-lg' : ''} transition-all duration-300`}>
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center">
              <button 
                onClick={toggleMenu} 
                className="p-2.5 mr-3 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150"
                aria-label="Toggle menu"
              >
                {isMenuOpen
                  ? <XIcon className="w-6 h-6" />
                  : <MenuIcon className="w-6 h-6" />}
              </button>
              <Link to="/created-sets" className="flex items-center group">
                <div className="flex items-center justify-center bg-white rounded-xl h-10 w-10 shadow-inner">
                  <img 
                    src="/images/cramingo_logo.png" 
                    alt="Fliply Logo" 
                    className="h-9 w-auto"
                  />
                </div>
                <span className="ml-3 font-bold text-lg tracking-wide">Cramingo</span>
              </Link>
            </div>
            <button 
              onClick={toggleFeedback} 
              className="p-2.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150" 
              aria-label="Give Feedback"
            >
              <MessageCircleQuestionIcon className="w-6 h-6" />
            </button>
          </div>
        </nav>
      )}

      {/* Menu - For both Mobile and Desktop - with improved animations */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop with enhanced blur effect */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        ></div>
        
        {/* Menu panel with improved animation */}
        <div 
          className={`absolute top-0 left-0 w-72 h-full bg-gradient-to-b from-[#004a74] to-[#0060a1] shadow-2xl transform transition-all duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-95'
          }`}
        >
          {/* Enhanced glass effect overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
          
          {/* User profile area with smoother styling */}
          <div className="relative pt-20 pb-6 px-6 z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">{user?.username || 'User Account'}</div>
                <div className="text-white/70 text-sm">{user?.email || 'Not signed in'}</div>
              </div>
            </div>
          </div>
          
          {/* Refined divider */}
          <div className="relative z-10 border-t border-white/15 mx-4"></div>
          
          {/* Navigation Items with improved hover effects */}
          <div className="relative z-10 px-3 py-6">
            <div className="space-y-1.5">
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
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 overflow-hidden relative
                      ${isActive 
                        ? 'bg-white/20 text-white shadow-md border border-white/10' 
                        : 'text-white/80 hover:bg-white/15 hover:text-white'
                      } group`}
                  >
                    {/* Light beam animation on hover */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                    
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10' : 'group-hover:bg-white/10'} transition-all duration-200 z-10`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                    </div>
                    <span className={`${isActive ? 'font-medium' : ''} z-10`}>{item.label}</span>
                    {isActive && <ChevronRightIcon className="w-4 h-4 ml-auto text-white/80 z-10" />}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Bottom section with feedback and logout */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/15 z-10">
            <div className="space-y-1.5 mb-6">
              <button
                onClick={() => {
                  toggleFeedback();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 relative overflow-hidden group"
              >
                {/* Light beam animation on hover */}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                
                <div className="p-1.5 rounded-lg group-hover:bg-white/10 transition-all duration-200 z-10">
                  <MessageCircleQuestionIcon className="w-5 h-5" />
                </div>
                <span className="z-10">Give Feedback</span>
              </button>
              
              <button
                onClick={() => {
                  // Handle logout logic here
                  if (logout) logout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 relative overflow-hidden group"
              >
                {/* Light beam animation on hover */}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                
                <div className="p-1.5 rounded-lg group-hover:bg-white/10 transition-all duration-200 z-10">
                  <LogOutIcon className="w-5 h-5" />
                </div>
                <span className="z-10">Sign Out</span>
              </button>
            </div>
            
            <div className="px-4 py-3 text-center">
              <div className="text-white/50 text-xs">Fliply • 2024</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal Component */}
      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
};

// Add these animations to your global CSS or tailwind.config.js
// @keyframes shine {
//   100% {
//     right: -10%;
//   }
// }
// 
// extend: {
//   animation: {
//     shine: 'shine 1s ease',
//   },
// },

export default NavBar;