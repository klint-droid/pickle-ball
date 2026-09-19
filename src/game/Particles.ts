import type { Particle } from '../types/game';

export class ParticleSystem {
  private particles: Particle[] = [];

  public emitHit(x: number, y: number, color: string, dirX: number) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (dirX > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.8;
      const speed = 2.5 + Math.random() * 6.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        color: Math.random() > 0.4 ? color : '#facc15',
        alpha: 1,
        life: 0,
        maxLife: 16 + Math.random() * 10,
        shape: 'spark'
      });
    }
  }

  // Top-down ground bounce ripple ring + dust particles
  public emitBounce(x: number, y: number) {
    // Expanding ring on court floor
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#bef264',
      alpha: 0.85,
      life: 0,
      maxLife: 16,
      shape: 'ring'
    });

    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color: '#f8fafc',
        alpha: 0.7,
        life: 0,
        maxLife: 14 + Math.random() * 8,
        shape: 'circle'
      });
    }
  }

  public emitNetHit(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        color: '#ffffff',
        alpha: 0.9,
        life: 0,
        maxLife: 14 + Math.random() * 8,
        shape: 'circle'
      });
    }
  }

  public emitConfetti(width: number, height: number) {
    const colors = ['#38bdf8', '#fb923c', '#facc15', '#4ade80', '#ec4899', '#a855f7'];
    for (let i = 0; i < 75; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.4,
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 3.5,
        size: 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 180 + Math.random() * 100,
        shape: 'rect',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15
      });
    }
  }

  public update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.shape === 'ring') {
        p.size += 1.4; // Expanding ripple ring
      }

      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot;
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'rect') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  public clear() {
    this.particles = [];
  }
}
