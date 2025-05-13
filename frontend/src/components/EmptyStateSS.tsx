import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, BookmarkIcon, ChevronRightIcon } from 'lucide-react';

type EmptySavedSetsProps = {
  onFindSets?: () => void;
};

/**
 * Empty state component displayed when a user has no saved flashcard sets
 * Provides an option to find and browse public sets
 * Fully responsive design that adapts to mobile and desktop screens
 * Improved mobile experience with larger, more tappable buttons
 */
const EmptySavedSets: React.FC<EmptySavedSetsProps> = ({ onFindSets }) => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile viewport on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Navigation handler
  const handleFindSets = () => {
    if (onFindSets) {
      onFindSets();
    } else {
      navigate('/search-sets');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] md:min-h-[calc(100vh-32rem)] w-full px-3 py-3 md:px-4 md:py-6 lg:py-8">
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Animated background elements - simplified on mobile */}
        <div className="absolute -top-6 md:-top-24 -right-4 md:-right-14 w-24 h-24 md:w-72 md:h-72 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-xl md:blur-3xl opacity-80 animate-pulse-slow"></div>
        <div className="absolute -bottom-6 md:-bottom-24 -left-4 md:-left-14 w-24 h-24 md:w-80 md:h-80 bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-full blur-xl md:blur-3xl opacity-80 animate-pulse-slow-delay"></div>
        {!isMobile && (
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-tr from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-full blur-2xl opacity-70 animate-float-slow"></div>
        )}
        
        {/* Premium main container with enhanced glass effect */}
        <div className="relative bg-white/90 backdrop-blur-xl rounded-lg md:rounded-2xl shadow-[0_8px_15px_-8px_rgba(0,0,0,0.15)] md:shadow-[0_15px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-white/80">
          {/* Animated rainbow gradient accent bar */}
          <div className="h-1.5 md:h-1.5 bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 via-amber-400 to-indigo-500 bg-size-200 animate-gradient-x"></div>
          
          <div className="p-4 md:p-6 lg:p-12">
            {/* Enhanced header with 3D effect - improved for mobile */}
            <div className="flex items-center mb-4 md:mb-8">
              <div className="flex-shrink-0 mr-3 md:mr-5 relative">
                <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-xl md:rounded-2xl blur-md opacity-70 animate-pulse-slow"></div>
                <div className="relative transform transition-transform hover:scale-105 duration-500">
                  <img
                    src="/images/empty_saved_sets.png"
                    alt="Character with magnifying glass"
                    className="w-12 h-12 md:w-24 md:h-24 object-contain drop-shadow-lg transform hover:rotate-3 transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="text-left">
                <h1 className="text-xl md:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-[#4f2a81] via-[#6b3ca9] to-[#8a4fd3] bg-clip-text text-transparent mb-0 md:mb-2">
                  No Saved Sets Yet
                </h1>
                <p className="text-gray-600 text-sm md:text-sm lg:text-base max-w-md">
                  {isMobile ? "Save sets to access them anytime" : "Looks like you haven't saved any flashcard sets yet"}
                </p>
              </div>
            </div>
            
            {/* Main call to action card */}
            <div 
              className="w-full mb-3 md:mb-6 transform hover:translate-y-[-2px] md:hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
              onMouseEnter={() => !isMobile && setIsHovering(true)}
              onMouseLeave={() => !isMobile && setIsHovering(false)}
              onClick={handleFindSets}
            >
              <div className="relative rounded-lg md:rounded-xl overflow-hidden shadow-md group">
                {/* Enhanced animated gradient border */}
                <div className="absolute -inset-[1.5px] bg-gradient-to-r from-indigo-600 via-purple-400 to-pink-500 to-amber-500 to-indigo-600 rounded-lg md:rounded-xl opacity-90 animate-gradient-x bg-size-200"></div>
                
                {/* Inner content with refined styling */}
                <div className="relative bg-gradient-to-br from-white to-indigo-50/30 rounded-[8px] md:rounded-[10px] p-3 md:p-5 group-hover:bg-gradient-to-br group-hover:from-indigo-50 group-hover:to-white/50 transition-all duration-300">
                  <div className="flex items-center">
                    {/* Enhanced icon styling */}
                    <div className="relative mr-3 md:mr-4 group/icon">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg blur opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-indigo-500 to-purple-400 p-2.5 md:p-3.5 rounded-lg shadow-md">
                        <SearchIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        
                        {/* Enhanced floating particles - disabled on mobile */}
                        {!isMobile && (
                          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-lg pointer-events-none">
                            <div className="absolute h-1.5 w-1.5 rounded-full bg-white/80 animate-float" style={{ top: '20%', left: '30%', animationDelay: '0s' }}></div>
                            <div className="absolute h-2 w-2 rounded-full bg-white/80 animate-float" style={{ top: '50%', left: '70%', animationDelay: '1s' }}></div>
                            <div className="absolute h-1.5 w-1.5 rounded-full bg-white/80 animate-float" style={{ top: '70%', left: '20%', animationDelay: '2s' }}></div>
                            <div className="absolute h-1 w-1 rounded-full bg-white/80 animate-float" style={{ top: '30%', left: '80%', animationDelay: '1.5s' }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-bold text-gray-800">Discover Flashcard Sets</h3>
                        
                        {/* Improved mobile action button - bigger and more prominent */}
                        {isMobile && (
                          <button
                            className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 text-white 
                                  py-1.5 px-3 rounded-md text-sm font-medium flex items-center shadow-sm ml-1"
                          >
                            <span className="relative">Find Sets</span>
                            <ChevronRightIcon className="w-4 h-4 ml-1" />
                          </button>
                        )}
                      </div>
                      
                      <p className="text-gray-500 text-sm md:text-sm mb-0 md:mb-3">
                        {isMobile ? "Browse and save sets for later" : "Find and save flashcard sets created by other students for quick access anytime"}
                      </p>
                      
                      {/* Only show on desktop */}
                      {!isMobile && (
                        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-3 md:space-y-0 mt-3">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              Popular
                            </span>
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-500 border border-white">+8</div>
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-white"></div>
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border border-white"></div>
                            </div>
                          </div>
                          
                          <button
                            className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 text-white 
                                      py-2 md:py-2.5 px-4 md:px-6 rounded-lg font-medium text-xs md:text-sm flex items-center shadow-md
                                      hover:shadow-lg transition-all duration-300 group/btn w-full md:w-auto justify-center md:justify-start"
                          >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent
                                -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out"></div>
                            
                            <span className="relative mr-1 md:mr-2">Find Sets</span>
                            <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Information card */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-lg md:rounded-xl shadow-sm md:shadow-md border border-gray-100/80 p-3 md:p-5 transition-all duration-300">
              <div className="flex flex-row items-start space-x-3 md:space-x-4">
                <div className="flex-shrink-0 bg-gradient-to-br from-amber-200/40 to-amber-100/40 p-2.5 md:p-3 rounded-lg mt-1">
                  <BookmarkIcon className="w-4 h-4 md:w-5 md:h-5 text-amber-700" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-base md:text-lg mb-1 md:mb-2">How to Save Sets</h3>
                  <p className="text-gray-500 text-xs md:text-sm">
                    Click the save icon on any set to add it to your collection. Saved sets will appear here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced animation keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .bg-size-200 {
            background-size: 200% 200%;
          }
          .animate-gradient-x {
            animation: gradient-x 8s ease infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); opacity: 0.7; }
            50% { transform: translateY(-7px); opacity: 1; }
            100% { transform: translateY(0px); opacity: 0.7; }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-float-slow {
            animation: float 8s ease-in-out infinite;
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.6; transform: scale(0.9); }
            50% { opacity: 0.9; transform: scale(1.05); }
          }
          .animate-pulse-slow {
            animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .animate-pulse-slow-delay {
            animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            animation-delay: 3s;
          }
        `
      }} />
    </div>
  );
};

export default EmptySavedSets;