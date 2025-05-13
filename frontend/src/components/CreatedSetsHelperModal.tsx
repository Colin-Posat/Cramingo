import React from 'react';
import { 
  XIcon,
  CheckCircleIcon,
  BookOpenIcon,
  SparklesIcon,
  UsersIcon
} from 'lucide-react';

interface WelcomeHelperModalProps {
  setShowHelper: React.Dispatch<React.SetStateAction<boolean>>;
}

const WelcomeHelperModal: React.FC<WelcomeHelperModalProps> = ({ setShowHelper }) => {
  // Define animations
  const keyframes = `
    @keyframes fadeScaleIn {
      0% {
        opacity: 0;
        transform: scale(0.95);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }
  `;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      {/* Include the keyframes style */}
      <style>{keyframes}</style>
      
      <div className="relative bg-white rounded-xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden" 
        style={{
          animation: 'fadeScaleIn 0.5s ease-out forwards'
        }}>
        {/* Top gradient bar */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-sky-500"></div>
        
        {/* Close button */}
        <button 
          onClick={() => setShowHelper(false)}
          className="absolute top-3 right-3 bg-gray-100 text-gray-600 p-1.5 rounded-full 
            hover:bg-gray-200 transition-all z-10 hover:rotate-90 duration-300"
          aria-label="Close modal"
        >
          <XIcon className="w-4 h-4" />
        </button>
        
        <div className="p-4 sm:p-6 text-center">
          {/* Logo space */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-1 sm:mb-2 flex items-center justify-center"
            style={{
              animation: 'float 4s ease-in-out infinite'
            }}>
            {/* Waving logo image */}
            <img 
              src="/images/waving.png" 
              alt="Cramingo Logo Waving" 
              className="w-full h-full object-contain" 
            />
          </div>
          
          {/* Welcome text */}
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent mb-1 sm:mb-2">
            Welcome to Cramingo!
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base max-w-xs mx-auto">
            Better flashcards, better grades
          </p>
          
          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-3 mb-4 sm:mb-6">
            {/* Feature 1 - AI Generation */}
            <div className="bg-gradient-to-r from-purple-50 to-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all group border border-purple-100 text-left flex items-start">
              <div className="mr-3 bg-purple-100 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white text-purple-600 transition-colors">
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-0.5 group-hover:text-purple-600 transition-colors">AI-Generated Cards</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Transform notes into flashcards instantly
                </p>
              </div>
            </div>
            
            {/* Feature 2 - Create Flashcards */}
            <div className="bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all group border border-blue-100 text-left flex items-start">
              <div className="mr-3 bg-blue-100 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white text-blue-600 transition-colors">
                <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-0.5 group-hover:text-blue-600 transition-colors">School-Specific Sets</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Find cards by school and class code
                </p>
              </div>
            </div>
            
            {/* Feature 3 - Community */}
            <div className="bg-gradient-to-r from-teal-50 to-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all group border border-teal-100 text-left flex items-start">
              <div className="mr-3 bg-teal-100 p-2 rounded-lg group-hover:bg-teal-600 group-hover:text-white text-teal-600 transition-colors">
                <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-0.5 group-hover:text-teal-600 transition-colors">Study Together</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Share and discover peer-created sets
                </p>
              </div>
            </div>
          </div>
          
          {/* Get started button */}
          <button 
            onClick={() => setShowHelper(false)}
            className="relative bg-gradient-to-r from-blue-500 to-sky-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg 
              font-bold shadow-lg hover:from-blue-600 hover:to-sky-600 transition-all duration-200 w-full flex items-center justify-center gap-2"
          >
            <div className="bg-white/30 p-1.5 sm:p-2 rounded-lg">
              <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-sm sm:text-base">Start Learning</span>
          </button>
          
          {/* Footer tip */}
          <p className="text-xs text-gray-500 mt-3 sm:mt-4">
            Tip: Try our AI generator to create flashcards in seconds!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHelperModal;