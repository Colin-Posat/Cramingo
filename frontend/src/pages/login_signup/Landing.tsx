import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { Brain, Search, ArrowRight, Users, BookOpen, ChevronRight, School, Sparkles, Zap, Award } from "lucide-react";
import ModernParticleBackground from "../../components/ParticlesBackground";
import ContactPopup from "../../components/FeedbackModal";
import TermsOfServicePopup from "../../components/TermsOfServicePopup";
import PrivacyPolicyPopup from "../../components/PrivacyPolicyPopup";
import { useTypingPlaceholder } from '../../components/useTypingPlaceholder';
import { API_BASE_URL } from '../../config/api';
import { universityAcronyms, enhanceUniversitySearch } from "../../utils/universitySearch";


const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolSetsMap, setSchoolSetsMap] = useState<{[key: string]: number}>({});
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
const inputContainerRef = useRef<HTMLDivElement>(null);
  
  // Animation control states
  const [animationTriggered, setAnimationTriggered] = useState<{[key: string]: boolean}>({
    features: false,
    howItWorks: false,
    testimonials: false,
    finalCta: false
  });
  
  // Simplified search functionality - only school input
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [allSchools, setAllSchools] = useState<string[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const schoolInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for scroll animations
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);

  const MemoizedParticleBackground = React.useMemo(() => (
    <ModernParticleBackground 
      particleCount={150}
      primaryColor="rgba(255, 255, 255, 0.5)"
      secondaryColor="rgba(173, 216, 230, 0.5)"
      accentColor="rgba(135, 206, 250, 0.7)"
      particleSize={{ min: 2, max: 6 }}
      particleSpeed={0.1}
    />
  ), []);

  // Fetch schools from CSV
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoadingSchools(true);
        const response = await fetch('/data/schools.csv');
        const text = await response.text();
        const schools = text.split('\n')
          .map(school => school.trim())
          .filter(school => school.length > 0);
        
        setAllSchools(schools);
        setIsLoadingSchools(false);
      } catch (error) {
        console.error('Error loading schools:', error);
        setIsLoadingSchools(false);
      }
    };
    
    fetchSchools();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if the click is outside both the input and dropdown
      if (
        dropdownRef.current && 
        inputContainerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
        setSchoolSearch(''); // Add this line to clear the input
      }
    }
  
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Set up intersection observer for animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2,
    };
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetId = entry.target.id;
          setAnimationTriggered(prev => ({
            ...prev,
            [targetId]: true
          }));
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all section refs
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (howItWorksRef.current) observer.observe(howItWorksRef.current);
    if (testimonialsRef.current) observer.observe(testimonialsRef.current);
    if (finalCtaRef.current) observer.observe(finalCtaRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Generate random set counts for all schools ONLY ONCE when they're loaded
    if (allSchools.length > 0 && Object.keys(schoolSetsMap).length === 0) {
      const newSetsMap: {[key: string]: number} = {};
      allSchools.forEach(school => {
        // Random number between 20-40 for each school
        newSetsMap[school] = Math.floor(Math.random() * 21) + 20;
      });
      setSchoolSetsMap(newSetsMap);
    }
  }, [allSchools]);
  
  // Add the school recognition function
  const isSchoolRecognized = (searchInput: string) => {
    if (!searchInput.trim()) return false;
    
    // Check for acronym match first
    const lowerSearchInput = searchInput.trim().toLowerCase();
    for (const [acronym, fullName] of Object.entries(universityAcronyms)) {
      if (acronym.toLowerCase() === lowerSearchInput) {
        return allSchools.some(
          school => school.toLowerCase() === fullName.toLowerCase()
        );
      }
    }
    
    // If no acronym match, check for direct school match
    return allSchools.some(
      school => school.toLowerCase() === searchInput.trim().toLowerCase()
    );
  };
  
  // Handle school search input
  const handleSchoolSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSchoolSearch(value);
    
    if (value.length > 0) {
      // Use the enhanced search function instead of simple filtering
      const enhancedResults = enhanceUniversitySearch(value, allSchools);
      setSchoolSuggestions(enhancedResults);
      setIsDropdownVisible(enhancedResults.length > 0);
    } else {
      setSchoolSuggestions([]);
      setIsDropdownVisible(false);
    }
  };
  // Enhanced school selection handler with loading state
  const handleSchoolSelect = (school: string) => {
    setSchoolSearch(school);
    setSchoolSuggestions([]);
    setIsDropdownVisible(false);
    
    // Show loading state
    setIsLoading(true);
    
    // Check if the school is in the valid list before saving to localStorage
    const isValid = allSchools.some(
      validSchool => validSchool.toLowerCase() === school.toLowerCase()
    );
    
    if (isValid) {
      // Only store the selected school in localStorage if it's valid
      localStorage.setItem('selectedSchool', school);
    }
    
    // Process the selection with a small delay for UX
    setTimeout(async () => {
      try {
        // Log on the server
        await fetch(`${API_BASE_URL}/logRoutes/logSearch`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ school })
        });
        
        if (isValid) {
          localStorage.setItem('searchSchool', school);
        }
        navigate('/signup');
      } catch (err) {
        console.error('Failed to log search:', err);
        if (isValid) {
          localStorage.setItem('searchSchool', school);
        }
        navigate('/signup');
      }
    }, 600);
  };
  const navigateToSignup = async () => {
    if (!schoolSearch.trim()) return;
    
    // Resolve any acronym to full school name before continuing
    let resolvedSchool = schoolSearch;
    const lowerSearch = schoolSearch.trim().toLowerCase();
    
    for (const [acronym, fullName] of Object.entries(universityAcronyms)) {
      if (acronym.toLowerCase() === lowerSearch) {
        resolvedSchool = fullName;
        break;
      }
    }
    
    // Check if the resolved school is in the valid list
    const isValid = allSchools.some(
      validSchool => validSchool.toLowerCase() === resolvedSchool.toLowerCase()
    );
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Log on the server using the resolved school name
      await fetch(`${API_BASE_URL}/logRoutes/logSearch`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school: resolvedSchool
        })
      });
      
      // Only store in localStorage if the school is valid
      if (isValid) {
        localStorage.setItem('searchSchool', resolvedSchool);
        localStorage.setItem('selectedSchool', resolvedSchool);
      }
      
      // Add a small delay for loading effect
      setTimeout(() => {
        navigate('/signup');
      }, 600);
    } catch (err) {
      console.error('Failed to log search:', err);
      // proceed even on error, but only store if valid
      if (isValid) {
        localStorage.setItem('searchSchool', resolvedSchool);
        localStorage.setItem('selectedSchool', resolvedSchool);
      }
      
      setTimeout(() => {
        navigate('/signup');
      }, 600);
    }
  };
  // Popup handlers
  const openContactPopup = () => setIsContactOpen(true);
  const closeContactPopup = () => setIsContactOpen(false);
  const openTermsPopup = () => setIsTermsOpen(true);
  const closeTermsPopup = () => setIsTermsOpen(false);
  const openPrivacyPopup = () => setIsPrivacyOpen(true);
  const closePrivacyPopup = () => setIsPrivacyOpen(false);
    
  // Testimonials data
  const testimonials = [
    {
      quote: "Cramingo helped me ace my Biology final! The AI-generated flashcards saved me hours of study time.",
      name: "Alex J.",
      school: "UC Santa Cruz"
    },
    {
      quote: "I use Cramingo for all my classes now. The flashcards are perfect and I can study anywhere.",
      name: "Taylor M.",
      school: "Stanford University"
    },
    {
      quote: "As a student with ADHD, Cramingo has been a game-changer for my study routine.",
      name: "Jordan P.",
      school: "UC Berkeley"
    }
  ];
  const popularUniversities = [
    "UCLA",
    "UC Berkeley",
    "University of Michigan",
    "Stanford",
    "NYU",
    "Penn State",
    "ASU",
    "UC Santa Cruz"
  ];

  const [isFocused, setIsFocused] = useState(false);

  const { displayText, cursorVisible } = useTypingPlaceholder(
    popularUniversities,
    100,  // typing speed in ms
    50,   // deleting speed in ms
    2000  // delay after completing word in ms
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#004a74] to-[#001f3f]">
      {/* Particle Background */}
      {MemoizedParticleBackground}
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Fixed Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 
                         bg-black/5 backdrop-blur-md border-b border-white/5">
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center bg-white bg-opacity-100 rounded-xl h-11 w-12 ">
              <img 
                src="/images/cramingo_logo.png" 
                alt="Cramingo Logo" 
                className="h-11 w-auto"
              />
            </div>
            <span className="text-white hidden lg:block ml-3 font-bold text-xl tracking-wide"></span>
          </Link>
          <nav className="flex items-center space-x-8">
            <button 
              onClick={openContactPopup}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Contact
            </button>
            <Link 
              to="/login" 
              className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full 
                       transition-colors text-sm font-medium border border-white/10"
            >
              Sign In
            </Link>
          </nav>
        </header>
        
        {/* Content Container */}
        <div className="container mx-auto px-4 flex-grow flex flex-col pt-28 pb-12">
          {/* Hero Section - Simplified with only school input */}
          <main className="flex-1 flex flex-col justify-center items-center">
            <section className="max-w-4xl mx-auto mb-12 text-center">
              <div className="relative z-10 animate-slideDown">
                <h1 className="text-6xl md:text-7xl font-bold text-white mb-5 leading-tight">
                  <span className="inline-block animate-fadeIn">
                    Ace Your Exams with
                  </span>
                  <div className="relative inline-block animate-pop">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">
                      {"Cramingo"}
                    </span>
                    <span className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 opacity-30 blur-sm animate-pulse"></span>
                  </div>
                </h1>
                <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed animate-fadeIn animation-delay-200">
                  Create and find perfect flashcards in seconds with AI.
                </p>
<div className="max-w-lg mx-auto mb-8 relative z-50 overflow-visible animate-fadeIn animation-delay-400">
{/* Enhanced School Input with Animated Border */}
<div
  ref={inputContainerRef}
  className="relative flex items-center animate-fadeIn transition-all duration-500 group"
>
  {/* Animated gradient border */}
  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
    <div className="absolute inset-0 rounded-full animate-pulse"></div>
  </div>
  
  {/* Input container with glass effect */}
  <div className="w-full flex items-center relative bg-white/90 backdrop-blur-sm rounded-full shadow-lg z-10">
    {/* Search icon */}
    <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-blue-500">
      <Search className="h-5 w-5" />
    </div>
    
    {/* The actual input */}
    <input
      ref={schoolInputRef}
      type="text"
      value={schoolSearch}
      onChange={handleSchoolSearchChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && schoolSearch.trim()) {
          navigateToSignup();
        }
      }}
      onFocus={() => {
        setIsFocused(true);
        if (schoolSuggestions.length > 0) {
          setIsDropdownVisible(true);
        }
      }}
      onBlur={() => setIsFocused(false)}
      placeholder={
        isLoadingSchools
          ? "Loading schools..."
          : (!isFocused && !schoolSearch)
            ? `${displayText}${cursorVisible ? '|' : ''}`
            : "Find flashcards for your school..."
      }
      className="w-full py-4 pl-12 pr-10 rounded-full text-gray-900 text-lg
                focus:outline-none focus:ring-0 bg-transparent
                transition-all duration-300"
      disabled={isLoadingSchools || isLoading}
      autoComplete="off"
    />
    
    {/* Loading spinner */}
    {isLoading && (
      <div className="absolute right-5 top-1/2 transform -translate-y-1/2 z-10">
        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )}
    
    {/* Clear button - only shows when there's text */}
    {schoolSearch && !isLoading && (
      <button 
        onClick={() => {
          setSchoolSearch('');
          setSchoolSuggestions([]);
          setIsDropdownVisible(false);
          if (schoolInputRef.current) {
            schoolInputRef.current.focus();
          }
        }}
        className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </button>
    )}
  </div>
</div>

{/* Enhanced School Suggestions Dropdown */}
{schoolSuggestions.length > 0 && isDropdownVisible && (
  <div 
    ref={dropdownRef}
    className="absolute z-[9999] mt-2 w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-blue-100/50 overflow-hidden" 
    style={{ 
      maxHeight: '300px', 
      overflowY: 'auto',
      animation: 'fadeInDown 0.3s ease-out forwards',
      transformOrigin: 'top center'
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent pointer-events-none rounded-xl"></div>
    
    <ul className="py-1 relative">
      {schoolSuggestions.map((school, index) => {
        const isExactMatch = allSchools.some(s => s.toLowerCase() === school.toLowerCase());
        const numberOfSets = schoolSetsMap[school] || 30;
        
        return (
          <li 
            key={index}
            className={`px-4 py-3 cursor-pointer hover:bg-blue-50/80 transition-colors flex items-center justify-between
                      ${index !== schoolSuggestions.length - 1 ? 'border-b border-blue-50' : ''}`}
            onClick={() => handleSchoolSelect(school)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100/70 mr-3">
                <School className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-gray-800 font-medium">{school}</span>
            </div>
            
            {isExactMatch ? (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100/80 text-blue-700 flex items-center space-x-1">
                {isSchoolRecognized(school) ? (
                  <>
                    <BookOpen className="h-3 w-3 mr-1" />
                    <span>{numberOfSets} Sets</span>
                  </>
                ) : 'New School'}
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100/80 text-gray-600 flex items-center">
                <span>Create</span>
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </span>
            )}
          </li>
        );
      })}
    </ul>
    
    {/* Footer with info text */}
    <div className="bg-blue-50/50 px-4 py-2 text-xs text-blue-700 border-t border-blue-100/50">
      <div className="flex items-center">
        <Sparkles className="h-3 w-3 mr-1.5" />
        <span>Select a school to continue</span>
      </div>
    </div>
  </div>
)}
    </div>


                
                {/* Find Flashcards Button - Updated with lower z-index */}
<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-fadeIn animation-delay-600 z-0">
  <div className="relative inline-flex items-center justify-center gap-4 group z-0">
    {/* Gradient blur */}
    <div
      className="absolute inset-0 duration-1000 opacity-60 transition-all 
                bg-gradient-to-r from-[#00c2ff] to-[#33ccff]
                rounded-xl blur-lg filter 
                group-hover:opacity-100 group-hover:duration-200"
    />
    {/* Button with loading state and lower z-index */}
    <button
      onClick={navigateToSignup}
      disabled={!schoolSearch.trim() || isLoading}
      className={`${
        !schoolSearch.trim() 
          ? 'bg-[#00c2ff]/70 cursor-not-allowed' 
          : 'bg-[#00c2ff] hover:bg-[#33ccff] hover:shadow-lg hover:-translate-y-0.5 hover:shadow-[#004a74]/30'
      } relative inline-flex items-center justify-center
        text-xl rounded-xl z-0
        px-10 py-5 font-semibold text-white
        transition-all duration-200`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        <>
          {!schoolSearch.trim() 
            ? 'Your school on Cramingo? Type to see!' 
            : isSchoolRecognized(schoolSearch)
              ? `See Flashcards for ${schoolSearch.trim()}` 
              : 'Create Flashcards with AI'}
          {schoolSearch.trim() && (
            <svg
              aria-hidden="true"
              viewBox="0 0 10 10"
              height="10"
              width="10"
              fill="none"
              className="ml-2 stroke-white stroke-2"
            >
              <path
                d="M0 5h7"
                className="transition opacity-0 group-hover:opacity-100"
              />
              <path
                d="M1 1l4 4-4 4"
                className="transition group-hover:translate-x-[3px]"
              />
            </svg>
          )}
        </>
      )}
    </button>
  </div>
</div>
{/* University request message */}
{schoolSearch.trim() && !isSchoolRecognized(schoolSearch) && (
  <div className="text-white/80 text-sm mt-3 animate-fadeIn">
    Don't see your university? <button 
      onClick={openContactPopup} 
      className="text-cyan-300 hover:text-cyan-200 underline transition-colors"
    >
      Request it to be added
    </button>
  </div>
)}
                
                <div className="text-white/60 text-sm animate-fadeIn animation-delay-800">

                </div>
              </div>
            </section>
            
            {/* Features Section */}
            <section id="features" ref={featuresRef} className="w-full max-w-6xl mx-auto mb-20 mt-3 px-4">
              <h2 className="text-4xl font-bold text-white text-center mb-12 animate-slideUp">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">
                  Why Students Love Cramingo
                </span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  {
                    icon: <Brain size={28} className="text-white" />,
                    title: "AI-Powered Precision",
                    description: "Our AI identifies key concepts and creates perfectly balanced question-answer pairs for optimal memory retention.",
                    gradient: "from-blue-400 to-cyan-300",
                    bgGradient: "from-blue-500/20 to-cyan-500/20"
                  },
                  {
                    icon: <Users size={28} className="text-white" />,
                    title: "Collaborative Learning",
                    description: "Share your flashcard sets with classmates or discover public sets from top students at your school.",
                    gradient: "from-purple-400 to-pink-300",
                    bgGradient: "from-purple-500/20 to-pink-500/20"
                  },
                  {
                    icon: <BookOpen size={28} className="text-white" />,
                    title: "Smart Study Modes",
                    description: "Switch between flashcards, quizzes, and interactive tests to reinforce learning and test your knowledge.",
                    gradient: "from-green-400 to-teal-300",
                    bgGradient: "from-green-500/20 to-teal-500/20"
                  }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className={`bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 
                      hover:border-blue-400/40 transition-all duration-700 relative overflow-hidden group ${
                        animationTriggered.features 
                          ? 'transform rotate-0 scale-100 opacity-100' 
                          : 'transform rotate-3 scale-95 opacity-0'
                      }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${feature.bgGradient} rounded-full blur-xl group-hover:scale-[2.5] transition-all duration-1000`}></div>
                    <div className={`absolute -left-20 -bottom-20 w-40 h-40 bg-gradient-to-br ${feature.bgGradient} rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-all duration-1000 delay-100`}></div>
                    <div className="relative z-10">
                      <div className={`bg-gradient-to-br ${feature.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white group-hover:scale-105 transform transition-transform duration-300">{feature.title}</h3>
                      <p className="text-white/70 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Testimonials Section */}
            <section id="testimonials" ref={testimonialsRef} className="w-full max-w-5xl mx-auto mb-20 px-4">
              <h2 className="text-4xl font-bold text-white text-center mb-12 animate-slideUp">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">
                  Student Success Stories
                </span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index} 
                    className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-all duration-700 ${
                      animationTriggered.testimonials 
                        ? 'transform translate-y-0 opacity-100 scale-100' 
                        : 'transform translate-y-10 opacity-0 scale-95'
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <div className="mb-4 text-yellow-300 flex">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 transition-all duration-300 ${animationTriggered.testimonials ? 'opacity-100' : 'opacity-0'}`}
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-white/90 italic mb-4">"{testimonial.quote}"</p>
                    <div className="text-white font-medium">{testimonial.name}</div>
                    <div className="text-white/60 text-sm">{testimonial.school}</div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Stats Bar */}
            <section className="w-full max-w-5xl mx-auto mb-20 px-4 overflow-hidden">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { number: "10,000+", label: "Active Students", icon: <Users className="w-6 h-6" /> },
                    { number: "50,000+", label: "Flashcards Created", icon: <BookOpen className="w-6 h-6" /> },
                    { number: "95%", label: "Better Grades", icon: <Award className="w-6 h-6" /> },
                    { number: "2.5 hrs", label: "Time Saved Per Week", icon: <Zap className="w-6 h-6" /> }
                  ].map((stat, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col items-center text-center group"
                    >
                      <div className="text-cyan-300 mb-2 transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                        {stat.icon}
                      </div>
                      <div className="text-white text-3xl font-bold animate-count-up">
                        {stat.number}
                      </div>
                      <div className="text-white/60 text-sm mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          {/* Final CTA - Updated with "Create an account for free" text */}
<section id="finalCta" ref={finalCtaRef} className="w-full max-w-4xl mx-auto mt-10 mb-20 px-6">
  <div 
    className={`bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-2xl p-10 text-center backdrop-blur-sm border border-white/10 shadow-xl transition-all duration-1000 ${
      animationTriggered.finalCta 
        ? 'transform scale-100 opacity-100' 
        : 'transform scale-90 opacity-0'
    }`}
  >
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-float">Ready to find the perfect flashcards?</h2>
    <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">Join thousands of students who are already saving time and improving their grades with Cramingo.</p>
    
    {/* Updated CTA Button with "Create an account for free" text */}
    <button 
      onClick={() => navigate('/signup')}
      disabled={isLoading}
      className={`
        bg-[#00c2ff] hover:bg-[#33ccff] hover:shadow-lg hover:-translate-y-0.5 hover:shadow-[#004a74]/30
        relative inline-flex items-center justify-center
        text-xl rounded-xl
        px-10 py-5 font-semibold text-white
        transition-all duration-200`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        <>
          Create an account for free
          <svg
            aria-hidden="true"
            viewBox="0 0 10 10"
            height="10"
            width="10"
            fill="none"
            className="ml-2 stroke-white stroke-2"
          >
            <path
              d="M0 5h7"
              className="transition opacity-0 group-hover:opacity-100"
            />
            <path
              d="M1 1l4 4-4 4"
              className="transition group-hover:translate-x-[3px]"
            />
          </svg>
        </>
      )}
    </button>
    <p className="text-white/60 text-sm mt-4">No credit card required • Free forever</p>
  </div>
</section>
          </main>
        </div>
        
        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:justify-between items-center text-white/50 text-sm gap-4">
            <div>
              © {new Date().getFullYear()} Cramingo. All rights reserved.
            </div>
            <div className="flex gap-6">
              <button
                onClick={openTermsPopup}
                className="underline hover:text-white transition-colors"
              >
                Terms of Service
              </button>{' '}
              <button
                onClick={openPrivacyPopup}
                className="underline hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button onClick={openContactPopup} className="hover:text-white transition-colors">Contact</button>
            </div>
          </div>
        </footer>
      </div>

      {/* Contact Popup */}
      <ContactPopup isOpen={isContactOpen} onClose={closeContactPopup} />
      
      {/* Terms of Service Popup */}
      <TermsOfServicePopup isOpen={isTermsOpen} onClose={closeTermsPopup} />

      <PrivacyPolicyPopup isOpen={isPrivacyOpen} onClose={closePrivacyPopup} />
    </div>
  );
};

const animations = `

@keyframes borderGlow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(0, 194, 255, 0.7);
  }
  50% {
    box-shadow: 0 0 15px rgba(0, 194, 255, 0.9);
  }
}

.animate-borderGlow {
  animation: borderGlow 2s ease-in-out infinite;
}
  
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -10px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes pop {
  0% { transform: scale(0.8); opacity: 0; }
  70% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}

@keyframes glowing {
  0% { box-shadow: 0 0 5px rgba(0, 194, 255, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 194, 255, 0.8); }
  100% { box-shadow: 0 0 5px rgba(0, 194, 255, 0.5); }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.8s ease-out forwards;
}

.animate-fadeInDown {
  animation: fadeInDown 0.3s ease-out forwards;
}

.animate-slideDown {
  animation: slideDown 0.8s ease-out forwards;
}

.animate-slideUp {
  animation: slideUp 0.8s ease-out forwards;
}

.animate-pop {
  animation: pop 0.8s ease-out forwards;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-count-up {
  animation: countUp 1.5s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}

.animation-delay-600 {
  animation-delay: 600ms;
}

.animation-delay-800 {
  animation-delay: 800ms;
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = animations;
  document.head.appendChild(style);
}

export default Landing
            