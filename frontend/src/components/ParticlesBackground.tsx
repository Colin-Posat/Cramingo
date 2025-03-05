import { useEffect, useRef } from "react";
import { Particle } from "../utils/particle"; // Ensure this is correctly imported

const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let particlesArray: Particle[] = [];
  let animationFrameId: number;
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const initParticles = () => {
      particlesArray = Array.from({ length: 100 }, () => new Particle(ctx, canvas.width, canvas.height));
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    const resizeCanvas = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);

      // Fade out particles
      canvas.style.transition = "opacity 0.3s ease-out";
      canvas.style.opacity = "0";

      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();

        // Fade in particles
        canvas.style.transition = "opacity 0.3s ease-in";
        canvas.style.opacity = "1";

        animateParticles();
      }, 50);
    };

    // Initial setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.opacity = "1";
    initParticles();
    animateParticles();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} id="particles"></canvas>;
};

export default ParticlesBackground;
