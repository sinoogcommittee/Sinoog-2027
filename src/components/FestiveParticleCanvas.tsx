import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface FestiveParticleCanvasRef {
  triggerBurst: (clientX: number, clientY: number) => void;
}

interface FestiveParticleCanvasProps {
  className?: string;
}

class EmberParticle {
  x: number = 0;
  y: number = 0;
  size: number = 1.5;
  speedY: number = -0.5;
  speedX: number = 0;
  alpha: number = 0.5;
  twinkleSpeed: number = 0.02;
  angle: number = 0;
  color: string = '#ffd966';

  constructor(width: number, height: number, initial: boolean = false) {
    this.reset(width, height, initial);
  }

  reset(width: number, height: number, initial: boolean = false): void {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : height + 15;
    this.size = Math.random() * 2.6 + 0.8;
    this.speedY = -(Math.random() * 0.7 + 0.22);
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.alpha = Math.random() * 0.75 + 0.25;
    this.twinkleSpeed = Math.random() * 0.03 + 0.012;
    this.angle = Math.random() * Math.PI * 2;
    const palette = ['#ffd966', '#fff3b0', '#f5c242', '#fbbf24', '#ffffff', '#ff6b6b'];
    this.color = palette[Math.floor(Math.random() * palette.length)];
  }

  update(width: number, height: number): void {
    this.y += this.speedY;
    this.angle += this.twinkleSpeed;
    this.x += this.speedX + Math.sin(this.angle) * 0.3;
    if (this.y < -20) {
      this.reset(width, height, false);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha * (0.65 + 0.35 * Math.sin(this.angle * 2));
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class BurstSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number = 0.09;
  alpha: number = 1;
  size: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7 + 2.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 4.2 + 2;
    const colors = ['#ffd966', '#fff6cc', '#ff2a38', '#f59e0b', '#38bdf8', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= 0.019;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const FestiveParticleCanvas = forwardRef<FestiveParticleCanvasRef, FestiveParticleCanvasProps>(
  function FestiveParticleCanvas({ className = '' }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const burstSparksRef = useRef<BurstSpark[]>([]);

    useImperativeHandle(ref, () => ({
      triggerBurst(clientX: number, clientY: number) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // Spawn 55 golden celebration sparks
        for (let i = 0; i < 55; i++) {
          burstSparksRef.current.push(new BurstSpark(canvasX, canvasY));
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animId: number;
      let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

      // Create 55 ambient rising golden embers
      const embers: EmberParticle[] = [];
      for (let i = 0; i < 55; i++) {
        embers.push(new EmberParticle(width, height, true));
      }

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      };

      window.addEventListener('resize', handleResize);

      const render = () => {
        ctx.clearRect(0, 0, width, height);

        // Update and draw floating embers
        for (const ember of embers) {
          ember.update(width, height);
          ember.draw(ctx);
        }

        // Update and draw burst sparks
        const sparks = burstSparksRef.current;
        for (let i = sparks.length - 1; i >= 0; i--) {
          sparks[i].update();
          sparks[i].draw(ctx);
          if (sparks[i].alpha <= 0) {
            sparks.splice(i, 1);
          }
        }

        animId = requestAnimationFrame(render);
      };

      render();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`festive-particle-canvas pointer-events-none select-none ${className}`}
        aria-hidden="true"
      />
    );
  }
);
