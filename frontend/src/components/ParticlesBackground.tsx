import React, { useEffect, useRef } from 'react';
import { Particle } from '../utils/particle';

const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // If particles already exist, update their canvas size
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach(particle => 
          particle.updateCanvasSize(canvas.width, canvas.height)
        );
      } else {
        // Initialize particles
        particlesRef.current = Array(100).fill(0).map(() => 
          new Particle(ctx, canvas.width, canvas.height)
        );
      }
    };
    
    // Initial setup
    resizeCanvas();
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', resizeCanvas);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', // Change from 'absolute' to 'fixed'
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // Keep it behind all content
        pointerEvents: 'none' // This is key - allows clicks to pass through
      }}
    />
  );
};

export default ParticlesBackground;