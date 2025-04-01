import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Brain, Share2, Search, ChevronRight } from "lucide-react";
import ModernParticleBackground from "../../components/ParticlesBackground";

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const processedIcon = React.isValidElement(icon)
  ? React.cloneElement(icon as React.ReactElement<any>, {
      size: 40,
      className: "mx-auto text-[#004a74]"
    })
  : icon;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center">
      <div className="mb-4">
        {processedIcon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#004a74]">
      {/* Particle Background */}
      <ModernParticleBackground 
        particleCount={150}
        primaryColor="rgba(255, 255, 255, 0.5)"
        secondaryColor="rgba(173, 216, 230, 0.5)"
        accentColor="rgba(135, 206, 250, 0.7)"
        particleSize={{ min: 2, max: 6 }}
        particleSpeed={0.1}
      />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Fixed Navigation Header with Shadow */}
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 
                           bg-black/20 backdrop-blur-sm border-b border-white/10 shadow-md">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/images/fliply_logo.png" 
              alt="Fliply Logo" 
              className="h-10 w-auto" 
            />
            <span className="text-white text-2xl font-bold tracking-wider">Fliply</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link 
              to="/contact" 
              className="text-white hover:text-blue-200 transition-colors"
            >
              Contact
            </Link>
            <Link 
              to="/login" 
              className="text-white hover:text-blue-200 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </header>
        
        {/* Content Container */}
        <div className="container mx-auto px-4 flex-grow flex flex-col pt-24 pb-12">
          {/* Flexible Spacer and Content */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Hero Section */}
            <main className="text-center">
              <section className="max-w-4xl mx-auto mb-16">
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                  Create, Share, and Study Smarter with Fliply
                </h1>
                <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto">
                  Revolutionize your learning with AI-powered study tools that make knowledge creation and sharing effortless.
                </p>
                <button 
                  onClick={() => navigate("/signup")} 
                  className="group bg-white text-[#004a74] font-bold py-4 px-10 rounded-full text-2xl 
                              transition-all duration-300 
                             flex items-center justify-center mx-auto space-x-2 hover:scale-105"
                >
                  <span className="text-dark-blue" >Get Started</span>
                </button>
              </section>
              
              {/* Features Section */}
              <section className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={<Brain />}
                  title="AI-Powered Creation"
                  description="Upload your notes and let our advanced AI transform them into comprehensive, organized study sets in moments."
                />
                <FeatureCard 
                  icon={<Share2 />}
                  title="Collaborative Learning"
                  description="Share study sets with classmates, get insights from peers, and accelerate your learning through community knowledge."
                />
                <FeatureCard 
                  icon={<Search />}
                  title="Discover Insights"
                  description="Browse a vast library of study sets created by students, finding resources tailored to your coursework and exams."
                />
              </section>
            </main>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center">
          <p className="text-white/70 mb-4">
            © {new Date().getFullYear()} Fliply. All rights reserved.
          </p>
          <nav className="flex justify-center space-x-6">
            <Link 
              to="/terms" 
              className="text-white hover:text-blue-200 transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              to="/privacy" 
              className="text-white hover:text-blue-200 transition-colors"
            >
              Privacy Policy
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default Landing;