import React, { useState } from 'react';
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

  const navItems = [
    { to: "/created-sets", icon: BookIcon, label: "Created Sets" },
    { to: "/saved-sets",   icon: BookmarkIcon, label: "Saved Sets" },
    { to: "/search-sets",  icon: SearchIcon, label: "Search Sets" },
    { to: "/profile",      icon: UserIcon, label: "Profile" },
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
    <nav className="fixed top-0 left-0 right-0 bg-[#004a74] text-white z-50 h-16">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between h-full px-3">
        <div className="w-24" />
        <div className="flex items-center justify-center gap-4">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  isActive
                    ? "bg-[#00659f] font-semibold"
                    : "hover:bg-[#00659f]"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="w-24 flex justify-end">
          <button
            onClick={toggleFeedback}
            className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-[#00659f] transition-colors"
            aria-label="Give Feedback"
          >
            <MessageCircleQuestionIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between h-full px-4">
        <Link to="/" className="text-xl font-bold" />
        <div className="flex items-center">
          <button onClick={toggleFeedback} className="p-2 mr-2" aria-label="Give Feedback">
            <MessageCircleQuestionIcon className="w-7 h-7" />
          </button>
          <button onClick={toggleMenu} className="p-2">
            {isMenuOpen
              ? <XIcon className="w-6 h-6" />
              : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#004a74] shadow-lg">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 border-b border-[#00659f] hover:bg-medium-blue ${
                  isActive ? "bg-[#00659f] font-semibold" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="bg-[#004a74] text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium">Submit Feedback or Question</h3>
              <button onClick={toggleFeedback} className="text-white hover:text-gray-200">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#004a74] focus:border-[#004a74]"
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
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#004a74] focus:border-[#004a74]"
                  placeholder="Please provide your feedback here..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              {submitSuccess === true && (
                <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
                  Thank you! Your feedback has been submitted.
                </div>
              )}
              {submitSuccess === false && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  There was an error submitting your feedback. Please try again.
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={toggleFeedback}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#004a74] hover:bg-[#00659f] focus:outline-none ${
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
      )}
    </nav>
  );
};

export default NavBar;
