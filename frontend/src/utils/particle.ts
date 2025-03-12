export class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  canvasWidth: number;
  canvasHeight: number;
  ctx: CanvasRenderingContext2D;
  readonly MAX_SPEED = 0.5; // Maximum speed limit
  
  constructor(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.size = Math.random() * 3 + 1;
    
    // Set initial speed with a smaller range
    this.speedX = (Math.random() - 0.5) * this.MAX_SPEED;
    this.speedY = (Math.random() - 0.5) * this.MAX_SPEED;
  }
  
  // Add a method to handle canvas resize
  updateCanvasSize(newWidth: number, newHeight: number) {
    // Calculate position ratio to maintain relative position
    const ratioX = this.x / this.canvasWidth;
    const ratioY = this.y / this.canvasHeight;
    
    // Update canvas dimensions
    this.canvasWidth = newWidth;
    this.canvasHeight = newHeight;
    
    // Update position based on ratio
    this.x = ratioX * newWidth;
    this.y = ratioY * newHeight;
    
    // Reset speed to prevent acceleration during resize
    this.speedX = (Math.random() - 0.5) * this.MAX_SPEED;
    this.speedY = (Math.random() - 0.5) * this.MAX_SPEED;
  }
  
  update() {
    // Update position
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Hard cap speed on every update
    this.speedX = Math.max(-this.MAX_SPEED, Math.min(this.speedX, this.MAX_SPEED));
    this.speedY = Math.max(-this.MAX_SPEED, Math.min(this.speedY, this.MAX_SPEED));
    
    // Bounce off walls with improved boundary checking
    if (this.x <= this.size) {
      this.x = this.size;
      this.speedX = Math.abs(this.speedX) * 0.8; // Reduce speed after collision
    } else if (this.x >= this.canvasWidth - this.size) {
      this.x = this.canvasWidth - this.size;
      this.speedX = -Math.abs(this.speedX) * 0.8; // Reduce speed after collision
    }
    
    if (this.y <= this.size) {
      this.y = this.size;
      this.speedY = Math.abs(this.speedY) * 0.8; // Reduce speed after collision
    } else if (this.y >= this.canvasHeight - this.size) {
      this.y = this.canvasHeight - this.size;
      this.speedY = -Math.abs(this.speedY) * 0.8; // Reduce speed after collision
    }
  }
  
  draw() {
    this.ctx.fillStyle = "rgba(227, 243, 255, 0.7)";
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fill();
  }
}