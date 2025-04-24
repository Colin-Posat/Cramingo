import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookIcon,
  BookmarkIcon,
  SearchIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  MessageCircleQuestionIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("");

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location]);

  const navItems = [
    { to: "/created-sets", icon: BookIcon, label: "Created Sets" },
    { to: "/saved-sets", icon: BookmarkIcon, label: "Saved Sets" },
    { to: "/search-sets", icon: SearchIcon, label: "Search Sets" },
    { to: "/profile", icon: UserIcon, label: "Profile" },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleFeedback = () => {
    setIsFeedbackOpen(!isFeedbackOpen);
    if (!isFeedbackOpen) {
      setFeedback('');
      setEmail('');
      setSubmitSuccess(null);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, email })
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFeedback('');
        setEmail('');
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setSubmitSuccess(null);
        }, 2000);
      } else {
        setSubmitSuccess(false);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-[#004a74] text-white z-50 h-16 shadow-lg">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between h-full px-0 w-full">
          <Link to="/created-sets" className="transition-transform hover:scale-105 ml-5">
            <img 
              src="/images/fliply_logo.png" 
              alt="Fliply Logo" 
              className="h-9 w-auto"
            />
          </Link>
          
          <div className="flex items-center justify-center">
            {navItems.map(item => {
              const isActive = activeTab === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-4 py-2 flex items-center gap-2 transition-all duration-300 hover:text-white group 
                    mx-2 md:mx-3 lg:mx-4 xl:mx-5 2xl:mx-6`}
                  onClick={() => setActiveTab(item.to)}
                >
                  <div className={`absolute inset-0 ${isActive ? 'opacity-100 group-hover:opacity-100' : 'opacity-0'} bg-white bg-opacity-10 rounded-md backdrop-blur-sm group-hover:opacity-10 transition-opacity`}></div>
                  <div className="z-10 flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-200'} transition-colors group-hover:text-white`} />
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
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#00659f] transition-all duration-200 mr-5"
            aria-label="Give Feedback"
          >
            <MessageCircleQuestionIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between h-full px-4">
          <Link to="/created-sets" className="flex items-center">
            <img 
              src="/images/fliply_logo.png" 
              alt="Fliply Logo" 
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center">
            <button 
              onClick={toggleFeedback} 
              className="p-2 mr-2 hover:bg-[#00659f] rounded-full transition-colors" 
              aria-label="Give Feedback"
            >
              <MessageCircleQuestionIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={toggleMenu} 
              className="p-2 hover:bg-[#00659f] rounded-full transition-colors"
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
        className={`md:hidden fixed top-16 right-0 w-64 h-screen bg-gradient-to-b from-[#004a74] to-[#00659f] z-40 shadow-lg transform transition-transform duration-300 ease-in-out ${
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
                className={`flex items-center gap-3 px-5 py-3 hover:bg-white hover:bg-opacity-10 transition-colors ${
                  isActive ? 'border-l-4 border-white' : 'border-l-4 border-transparent'
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
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn">
            <div className="bg-[#004a74] text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-medium text-lg">Submit Feedback or Question</h3>
              <button 
                onClick={toggleFeedback} 
                className="text-white hover:text-gray-200 transition-colors rounded-full hover:bg-white hover:bg-opacity-10 p-1"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <form onSubmit={handleSubmitFeedback}>
              {/* Email Input */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#004a74] focus:border-[#004a74] transition-colors"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Feedback Textarea */}
              <div className="mb-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#004a74] focus:border-[#004a74] transition-colors"
                  placeholder="Please provide your feedback here..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              {submitSuccess === true && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2 animate-fadeIn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Thank you! Your feedback has been submitted.</span>
                </div>
              )}
              
              {submitSuccess === false && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 animate-fadeIn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>There was an error submitting your feedback. Please try again.</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={toggleFeedback}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004a74]"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#004a74] hover:bg-[#00659f] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004a74] ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Space for fixed navbar is handled by your page layout */}
    </>
  );
};

// Add this to your CSS or tailwind.config.js
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// .animate-fadeIn {
//   animation: fadeIn 0.3s ease-in-out;
// }

export default NavBar;