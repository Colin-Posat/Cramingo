import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, PlusIcon, SearchIcon, UsersIcon, ChevronRightIcon } from 'lucide-react';

type EmptyStateProps = {
  onShowAIGenerateOverlay?: () => void;
};

/**
 * Enhanced empty state component displayed when a user has no flashcard sets
 * Provides interactive options to create cards with AI, manually, or browse public sets
 * Fully responsive design that adapts to mobile and desktop screens
 * Improved mobile experience with larger, more tappable buttons
 */
const EmptyStateCS: React.FC<EmptyStateProps> = ({ onShowAIGenerateOverlay }) => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState('');
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
  
  // Navigation handlers
  const handleCreateSet = () => navigate('/set-creator');
  const handleSearchSets = () => navigate('/search-sets');
  const handleAIGenerate = () => {
    if (onShowAIGenerateOverlay) {
      onShowAIGenerateOverlay();
    } else {
      navigate('/ai-generator');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] md:min-h-[calc(100vh-32rem)] w-full px-3 py-3 md:px-4 md:py-6 lg:py-8">
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Animated background elements - simplified on mobile */}
        <div className="absolute -top-6 md:-top-24 -right-4 md:-right-14 w-24 h-24 md:w-72 md:h-72 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-sky-500/10 rounded-full blur-xl md:blur-3xl opacity-80 animate-pulse-slow"></div>
        <div className="absolute -bottom-6 md:-bottom-24 -left-4 md:-left-14 w-24 h-24 md:w-80 md:h-80 bg-gradient-to-tr from-cyan-500/10 via-blue-500/10 to-indigo-500/10 rounded-full blur-xl md:blur-3xl opacity-80 animate-pulse-slow-delay"></div>
        {!isMobile && (
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-tr from-yellow-500/5 via-orange-500/5 to-red-500/5 rounded-full blur-2xl opacity-70 animate-float-slow"></div>
        )}
        
        {/* Premium main container with enhanced glass effect */}
        <div className="relative bg-white/90 backdrop-blur-xl rounded-lg md:rounded-2xl shadow-[0_8px_15px_-8px_rgba(0,0,0,0.15)] md:shadow-[0_15px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-white/80">
          {/* Animated rainbow gradient accent bar */}
          <div className="h-1.5 md:h-1.5 bg-gradient-to-r from-blue-500 via-purple-400 to-sky-500 via-emerald-400 to-blue-500 bg-size-200 animate-gradient-x"></div>
          
          <div className="p-4 md:p-6 lg:p-12">
            {/* Enhanced header with 3D effect - improved for mobile */}
            <div className="flex items-center mb-4 md:mb-8">
              <div className="flex-shrink-0 mr-3 md:mr-5 relative">
                <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-blue-200 to-sky-200 rounded-xl md:rounded-2xl blur-md opacity-70 animate-pulse-slow"></div>
                <div className="relative transform transition-transform hover:scale-105 duration-500">
                  <img
                    src="/images/empty_created_sets.png"
                    alt="Cramingo"
                    className="w-12 h-12 md:w-24 md:h-24 object-contain drop-shadow-lg transform hover:rotate-3 transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="text-left">
                <h1 className="text-xl md:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-[#00395a] via-[#004a74] to-[#0074c2] bg-clip-text text-transparent mb-0 md:mb-2">
                  Start Your Journey
                </h1>
                <p className="text-gray-600 text-sm md:text-sm lg:text-base max-w-md">
                  {isMobile ? "Begin mastering concepts today" : "Choose how to build your first set and begin mastering concepts"}
                </p>
              </div>
            </div>
            
            {/* Enhanced AI Option Card - Improved for mobile with bigger button */}
            <div 
              className="w-full mb-3 md:mb-6 transform hover:translate-y-[-2px] md:hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
              onMouseEnter={() => !isMobile && setIsHovering('ai')}
              onMouseLeave={() => !isMobile && setIsHovering('')}
              onClick={handleAIGenerate}
            >
              <div className="relative rounded-lg md:rounded-xl overflow-hidden shadow-md group">
                {/* Enhanced animated gradient border */}
                <div className="absolute -inset-[1.5px] bg-gradient-to-r from-blue-600 via-sky-400 to-blue-500 to-purple-500 to-blue-600 rounded-lg md:rounded-xl opacity-90 animate-gradient-x bg-size-200"></div>
                
                {/* Inner content with refined styling */}
                <div className="relative bg-gradient-to-br from-white to-blue-50/30 rounded-[8px] md:rounded-[10px] p-3 md:p-5 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-white/50 transition-all duration-300">
                  <div className="flex items-center">
                    {/* Enhanced premium icon styling */}
                    <div className="relative mr-3 md:mr-4 group/icon">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-sky-400 rounded-lg blur opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-sky-400 p-2.5 md:p-3.5 rounded-lg shadow-md">
                        <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        
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
                        <h3 className="text-base md:text-lg font-bold text-gray-800">AI-Generated Flashcards</h3>
                        
                        {/* Improved mobile action button - bigger and more prominent */}
                        {isMobile && (
                          <button
                            className="bg-gradient-to-r from-blue-500 via-blue-600 to-sky-500 text-white 
                                  py-1.5 px-3 rounded-md text-sm font-medium flex items-center shadow-sm ml-1"
                          >
                            <span className="relative">Create</span>
                            <ChevronRightIcon className="w-4 h-4 ml-1" />
                          </button>
                        )}
                      </div>
                      
                      <p className="text-gray-500 text-sm md:text-sm mb-0 md:mb-3">
                        {isMobile ? "Transform notes into flashcards instantly" : "Transform your notes, PDFs, or links into perfectly crafted flashcards instantly"}
                      </p>
                      
                      {/* Only show on desktop */}
                      {!isMobile && (
                        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-3 md:space-y-0 mt-3">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Popular
                            </span>
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-500 border border-white">+5</div>
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border border-white"></div>
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border border-white"></div>
                            </div>
                          </div>
                          
                          <button
                            className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-sky-500 text-white 
                                      py-2 md:py-2.5 px-4 md:px-6 rounded-lg font-medium text-xs md:text-sm flex items-center shadow-md
                                      hover:shadow-lg transition-all duration-300 group/btn w-full md:w-auto justify-center md:justify-start"
                          >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent
                                -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out"></div>
                            
                            <span className="relative mr-1 md:mr-2">Generate Now</span>
                            <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced option cards - Stack on mobile, side by side on desktop - IMPROVED MOBILE BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
              {/* Manual Creation - Elevated design with improved mobile UI */}
              <div 
                className={`bg-gradient-to-br from-white to-blue-50/50 rounded-lg md:rounded-xl shadow-sm md:shadow-md border border-gray-100/80 p-3 md:p-5 transition-all duration-300 hover:shadow-lg hover:border-blue-200/70 group cursor-pointer ${isHovering === 'manual' && !isMobile ? 'transform -translate-y-1' : ''}`}
                onMouseEnter={() => !isMobile && setIsHovering('manual')}
                onMouseLeave={() => !isMobile && setIsHovering('')}
                onClick={handleCreateSet}
              >
                <div className="flex flex-row items-center space-x-3 md:space-x-4">
                  <div className="bg-gradient-to-br from-[#004a74]/10 to-[#0074c2]/10 p-2.5 md:p-3 rounded-lg group-hover:bg-gradient-to-br group-hover:from-[#004a74]/20 group-hover:to-[#0074c2]/20 transition-all duration-300">
                    <PlusIcon className="w-4 h-4 md:w-5 md:h-5 text-[#004a74]" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-base md:text-lg mb-0 md:mb-1">Create Manually</h3>
                      
                      {/* Mobile-only button */}
                      {isMobile && (
                        <button
                          className="bg-[#004a74] text-white py-1.5 px-3 rounded-md text-sm font-medium flex items-center shadow-sm ml-1"
                        >
                          <span>Create</span>
                          <ChevronRightIcon className="w-4 h-4 ml-1" />
                        </button>
                      )}
                    </div>
                    
                    {isMobile && (
                      <p className="text-gray-500 text-sm mb-0">Create your own custom cards</p>
                    )}
                    
                    {!isMobile && (
                      <p className="text-gray-500 text-xs md:text-sm mb-2 md:mb-3">Build your own custom flashcards with your content</p>
                    )}
                    
                    {!isMobile && (
                      <button
                        className="w-full bg-white text-[#004a74] py-1.5 md:py-2 px-3 md:px-4 rounded-lg border border-[#004a74]/70 
                                hover:bg-[#004a74] hover:text-white transition-all duration-200 text-xs md:text-sm font-medium
                                shadow-sm flex items-center justify-center group-hover:bg-[#004a74] group-hover:text-white"
                      >
                        <span>Start Creating</span>
                        <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Browse - Elevated design with improved mobile UI */}
              <div 
                className={`bg-gradient-to-br from-white to-gray-50/50 rounded-lg md:rounded-xl shadow-sm md:shadow-md border border-gray-100/80 p-3 md:p-5 transition-all duration-300 hover:shadow-lg hover:border-gray-200/70 group cursor-pointer ${isHovering === 'browse' && !isMobile ? 'transform -translate-y-1' : ''}`}
                onMouseEnter={() => !isMobile && setIsHovering('browse')}
                onMouseLeave={() => !isMobile && setIsHovering('')}
                onClick={handleSearchSets}
              >
                <div className="flex flex-row items-center space-x-3 md:space-x-4">
                  <div className="bg-gradient-to-br from-gray-200/40 to-gray-100/40 p-2.5 md:p-3 rounded-lg group-hover:bg-gradient-to-br group-hover:from-gray-200/60 group-hover:to-gray-100/60 transition-all duration-300">
                    <SearchIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-base md:text-lg mb-0 md:mb-1">Browse Sets</h3>
                      
                      {/* Mobile-only button */}
                      {isMobile && (
                        <button
                          className="bg-gray-700 text-white py-1.5 px-3 rounded-md text-sm font-medium flex items-center shadow-sm ml-1"
                        >
                          <span>Browse</span>
                          <ChevronRightIcon className="w-4 h-4 ml-1" />
                        </button>
                      )}
                    </div>
                    
                    {isMobile && (
                      <p className="text-gray-500 text-sm mb-0">Find sets from other students</p>
                    )}
                    
                    {!isMobile && (
                      <p className="text-gray-500 text-xs md:text-sm mb-2 md:mb-3">Discover flashcards created by other students</p>
                    )}
                    
                    {!isMobile && (
                      <button
                        className="w-full bg-white text-gray-700 py-1.5 md:py-2 px-3 md:px-4 rounded-lg border border-gray-300 
                                hover:bg-gray-700 hover:text-white transition-all duration-200 text-xs md:text-sm font-medium
                                shadow-sm flex items-center justify-center group-hover:bg-gray-700 group-hover:text-white"
                      >
                        <span>Explore Collection</span>
                        <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </button>
                    )}
                  </div>
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

export default EmptyStateCS;