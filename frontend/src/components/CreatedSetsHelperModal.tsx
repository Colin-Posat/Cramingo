// CreatedSetsHelperModal.tsx
import React from 'react';
import { 
  XIcon,
  PlusIcon,
  SearchIcon,
  CheckCircleIcon,
  BookIcon
} from 'lucide-react';

interface CreatedSetsHelperModalProps {
  setShowHelper: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreatedSetsHelperModal: React.FC<CreatedSetsHelperModalProps> = ({ setShowHelper }) => {
  // Define animations within the component using styled keyframes
  const keyframes = `
    @keyframes fadeScaleIn {
      0% {
        opacity: 0;
        transform: scale(0.9);
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
        transform: translateY(-10px);
      }
    }

    @keyframes bounceDelayed {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    @keyframes backgroundMove {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
  `;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm overflow-y-auto">
      {/* Include the keyframes style */}
      <style>{keyframes}</style>
      
      <div className="relative bg-white rounded-xl w-full max-w-md md:max-w-lg lg:max-w-2xl shadow-xl overflow-hidden" 
        style={{
          animation: 'fadeScaleIn 0.4s ease-out forwards'
        }}>
        {/* Animated top bar gradient */}
        <div className="h-1.5 md:h-2 bg-gradient-to-r from-[#004a74] via-[#0092e0] to-[#004a74]" 
          style={{
            backgroundSize: '200%',
            animation: 'backgroundMove 3s ease infinite'
          }}></div>
        
        {/* Close button in corner - Increased touch target size for mobile */}
        <button 
          onClick={() => setShowHelper(false)}
          className="absolute top-2 right-2 md:top-4 md:right-4 bg-gray-100 text-gray-600 p-2 rounded-full 
            hover:bg-gray-200 transition-all z-10 hover:rotate-90 duration-300"
          aria-label="Close modal"
        >
          <XIcon className="w-5 h-5" />
        </button>
        
        <div className="p-4 md:p-6 lg:p-8 text-center">
          {/* Header with animated elements - reduced size on mobile */}
          <div className="relative mb-4 md:mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-100 rounded-full opacity-40 animate-pulse"></div>
            </div>
            <BookIcon className="mx-auto w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-[#004a74] mb-2 md:mb-3" 
              style={{
                animation: 'float 3s ease-in-out infinite'
              }} />
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#004a74] relative">
              Let's Get Started!
              <div className="absolute -right-2 -top-2" 
                style={{
                  animation: 'bounceDelayed 2s infinite 1s'
                }}>
                <div className="bg-amber-400 text-white p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0110 2v5h5a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H3a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </h2>
            <p className="text-[#00659f] mt-1 md:mt-2 text-sm md:text-base">Your Personal Study Revolution</p>
          </div>
          
          {/* Content with interactive cards - stack on mobile, grid on larger screens */}
          <div className="max-w-sm md:max-w-xl mx-auto mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 md:p-4 lg:p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer group border border-blue-100">
              <div className="mb-2 md:mb-3 flex justify-center">
                <div className="bg-[#004a74] text-white w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold group-hover:scale-110 transition-transform">1</div>
              </div>
              <div className="flex items-center justify-center mb-2 md:mb-4">
                <PlusIcon className="w-7 h-7 md:w-10 md:h-10 text-[#004a74] group-hover:text-[#0092e0] transition-colors" />
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold text-[#004a74] mb-1 md:mb-2">Create Your Own Sets</h3>
              <p className="text-gray-700 text-xs md:text-sm lg:text-base">
                Build custom flashcards for any subject and ace your exams with personalized study materials.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 md:p-4 lg:p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer group border border-blue-100">
              <div className="mb-2 md:mb-3 flex justify-center">
                <div className="bg-[#004a74] text-white w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold group-hover:scale-110 transition-transform">2</div>
              </div>
              <div className="flex items-center justify-center mb-2 md:mb-4">
                <SearchIcon className="w-7 h-7 md:w-10 md:h-10 text-[#004a74] group-hover:text-[#0092e0] transition-colors" />
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold text-[#004a74] mb-1 md:mb-2">Discover Sets</h3>
              <p className="text-gray-700 text-xs md:text-sm lg:text-base">
                Find flashcards made by classmates and study together to boost your learning efficiency.
              </p>
            </div>
          </div>
          
          {/* Action button with animation - Larger touch target for mobile */}
          <button 
            onClick={() => setShowHelper(false)}
            className="bg-gradient-to-r from-[#004a74] to-[#0092e0] text-white px-5 md:px-6 lg:px-8 py-2.5 md:py-3 rounded-lg 
              hover:from-[#00395c] hover:to-[#0074c2] transition-all flex items-center 
              justify-center mx-auto gap-2 text-sm md:text-base lg:text-lg font-medium shadow-lg
              hover:shadow-xl active:scale-[0.98] relative overflow-hidden group"
          >
            <span className="absolute w-full h-full top-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span>Start Now!</span>
          </button>
          
          {/* Footer with better spacing for mobile */}
          <p className="text-xs text-gray-500 mt-4 md:mt-5 px-2">
            Tip: Create your first set today to unlock your full study potential
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatedSetsHelperModal;