import React from 'react';

interface GradientWaveBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  speed?: number;
}

const GradientWaveBackground: React.FC<GradientWaveBackgroundProps> = ({
  primaryColor = '#004a74',
  secondaryColor = '#0077b6', 
  speed = 1
}) => {
  // Calculate animation duration based on speed
  const duration = 20 / speed;
  
  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0, pointerEvents: 'none' }}>
      {/* Main background */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
          opacity: 0.8
        }}
      />
      
      {/* Animated wave overlay */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 25%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 15%)
          `,
          backgroundSize: '150% 150%, 100% 100%',
          animation: `waveBackground ${duration}s ease-in-out infinite`
        }}
      >
        {/* Floating circles */}
        <div 
          className="absolute w-[150vw] h-[150vh] rounded-[40%] top-[-25vh] left-[-25vw]"
          style={{
            background: `rgba(255, 255, 255, 0.05)`,
            animation: `rotate ${duration * 2}s linear infinite`
          }}
        />
        
        <div 
          className="absolute w-[150vw] h-[150vh] rounded-[45%] top-[-20vh] left-[-20vw]"
          style={{
            background: `rgba(255, 255, 255, 0.02)`,
            animation: `rotate ${duration * 1.5}s linear infinite reverse`
          }}
        />
      </div>
      
      {/* Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes waveBackground {
          0%, 100% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
        }
        
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}} />
    </div>
  );
};

export default GradientWaveBackground;