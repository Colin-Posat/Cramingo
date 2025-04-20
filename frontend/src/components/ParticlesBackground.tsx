import React, { useState, useEffect } from 'react';

interface ParticleBackgroundProps {
  particleCount?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  particleSize?: { min: number; max: number };
  particleSpeed?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocityX: number;
  velocityY: number;
  boundaryCollision: {
    x: boolean;
    y: boolean;
  };
}

const ModernParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 100,
  primaryColor = 'rgba(255, 255, 255, 0.5)',
  secondaryColor = 'rgba(173, 216, 230, 0.5)',
  accentColor = 'rgba(135, 206, 250, 0.7)',
  particleSize = { min: 2, max: 6 },
  particleSpeed = 0.3 // Reduced speed significantly
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Initialize particles
  useEffect(() => {
    const container = document.querySelector('.particle-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }

    const colors = [primaryColor, secondaryColor, accentColor];
    const initialParticles = Array.from({ length: particleCount }).map((_, index) => {
      const size = Math.random() * (particleSize.max - particleSize.min) + particleSize.min;
      return {
        id: index,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocityX: (Math.random() - 0.5) * particleSpeed,
        velocityY: (Math.random() - 0.5) * particleSpeed,
        boundaryCollision: { x: false, y: false }
      };
    });

    setParticles(initialParticles);
  }, [particleCount, primaryColor, secondaryColor, accentColor, particleSize, particleSpeed]);

  // Animate particles
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.velocityX;
          let newY = particle.y + particle.velocityY;
          let newVelocityX = particle.velocityX;
          let newVelocityY = particle.velocityY;

          // Bounce off walls with more natural reflection
          const bounceMultiplier = 0.9; // Slight energy loss on bounce
          if (newX <= 0 || newX >= 100) {
            newVelocityX = -particle.velocityX * bounceMultiplier;
            newX = newX <= 0 ? 0 : 100;
          }
          if (newY <= 0 || newY >= 100) {
            newVelocityY = -particle.velocityY * bounceMultiplier;
            newY = newY <= 0 ? 0 : 100;
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            velocityX: newVelocityX,
            velocityY: newVelocityY
          };
        })
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [particles]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none particle-container" style={{ zIndex: 0 }}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#004a74] to-[#023047]"></div>
      
      {/* Particle Container */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              top: `${particle.y}%`,
              left: `${particle.x}%`,
              backgroundColor: particle.color,
              opacity: 0.5,
              boxShadow: `0 0 ${particle.size}px ${particle.color}`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ModernParticleBackground;