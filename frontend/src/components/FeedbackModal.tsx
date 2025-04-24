import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);

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
          onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white text-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn">
        <div className="bg-[#004a74] text-white px-5 py-4 flex justify-between items-center">
          <h3 className="font-medium text-lg">Submit Feedback or Question</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 transition-colors rounded-full hover:bg-white hover:bg-opacity-10 p-1"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 p-3 bg-blue-50 text-black rounded-md">
            <p className="text-sm">
              <strong>Our email:</strong> fliply.help@gmail.com
            </p>
            <p className="text-sm mt-1">
              You can email us or submit a message here
            </p>
          </div>
          
          <form onSubmit={handleSubmitFeedback}>
            {/* Email Input */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email (optional)
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
              <p className="mt-1 text-xs text-gray-500">Include if you'd like us to contact you back</p>
            </div>

            {/* Feedback Textarea */}
            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                Feedback or Question
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#004a74] focus:border-[#004a74] transition-colors"
                placeholder="Please provide your message here..."
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
                onClick={onClose}
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
  );
};

export default FeedbackModal;