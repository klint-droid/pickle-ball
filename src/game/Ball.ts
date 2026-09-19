import type { Ball, BallTrailPoint, PlayerId, CourtDimensions, CourtSide } from '../types/game';
import { sound } from './Audio';
import { ParticleSystem } from './Particles';

export class BallEntity implements Ball {
  public x: number = 0;
  public y: number = 0;
  public z: number = 0;
  public radius: number = 9;
  public vx: number = 0;
  public vy: number = 0;
  public vz: number = 0;
  public gravity: number = 0.32;
  public rotation: number = 0;
  public lastHitBy: PlayerId | null = null;
  public bounceCountOnSide: number = 0;
  public currentSide: 'left' | 'right' | null = null;
  public hasBouncedSinceHit: boolean = false;
  public isServe: boolean = false;
  public shotCountInRally: number = 0;
  public targetServiceBox: { minX: number; maxX: number; minY: number; maxY: number } | null = null;
  public trail: BallTrailPoint[] = [];
  public isActive: boolean = false;

  private restitution: number = 0.74; // Pickleball bounce energy retention
  private airFriction: number = 0.997;

  constructor(court: CourtDimensions) {
    this.resetToServe('player1', 'even', court);
  }

  public resetToServe(server: PlayerId, serverCourt: CourtSide, court: CourtDimensions) {
    this.isActive = true;
    this.bounceCountOnSide = 0;
    this.hasBouncedSinceHit = false;
    this.lastHitBy = server;
    this.isServe = true;
    this.shotCountInRally = 0;
    this.trail = [];
    this.z = 18; // Height in server hand

    const centerY = court.centerlineY;

    if (server === 'player1') {
      this.currentSide = 'left';
      // Server position
      this.x = court.courtLeft - 10;
      this.y = serverCourt === 'even' ? centerY + 100 : centerY - 100;

      // Target diagonal service box across the net
      if (serverCourt === 'even') {
        // Diagonal: P2 Top (Even) service box
        this.targetServiceBox = {
          minX: court.kitchenRight,
          maxX: court.courtRight,
          minY: court.courtTop,
          maxY: centerY
        };
      } else {
        // Diagonal: P2 Bottom (Odd) service box
        this.targetServiceBox = {
          minX: court.kitchenRight,
          maxX: court.courtRight,
          minY: centerY,
          maxY: court.courtBottom
        };
      }

      // Serve trajectory towards center of target box
      const targetX = (this.targetServiceBox.minX + this.targetServiceBox.maxX) / 2;
      const targetY = (this.targetServiceBox.minY + this.targetServiceBox.maxY) / 2;
      const flightFrames = 48;

      this.vx = (targetX - this.x) / flightFrames;
      this.vy = (targetY - this.y) / flightFrames;
      // High upward arc to clear the 36px net easily
      this.vz = 7.8;
    } else {
      this.currentSide = 'right';
      // P2 serving
      this.x = court.courtRight + 10;
      this.y = serverCourt === 'even' ? centerY - 100 : centerY + 100;

      // Target diagonal service box across net
      if (serverCourt === 'even') {
        // Diagonal: P1 Bottom (Even) service box
        this.targetServiceBox = {
          minX: court.courtLeft,
          maxX: court.kitchenLeft,
          minY: centerY,
          maxY: court.courtBottom
        };
      } else {
        // Diagonal: P1 Top (Odd) service box
        this.targetServiceBox = {
          minX: court.courtLeft,
          maxX: court.kitchenLeft,
          minY: court.courtTop,
          maxY: centerY
        };
      }

      const targetX = (this.targetServiceBox.minX + this.targetServiceBox.maxX) / 2;
      const targetY = (this.targetServiceBox.minY + this.targetServiceBox.maxY) / 2;
      const flightFrames = 48;

      this.vx = (targetX - this.x) / flightFrames;
      this.vy = (targetY - this.y) / flightFrames;
      this.vz = 7.8;
    }

    sound.playHit(0.95);
  }

  public update(court: CourtDimensions, particles: ParticleSystem): {
    fault: boolean;
    reason: string;
    winner: PlayerId | null;
  } | null {
    if (!this.isActive) return null;

    const prevX = this.x;

    // Apply gravity to altitude
    this.vz -= this.gravity;

    // Apply horizontal air friction
    this.vx *= this.airFriction;
    this.vy *= this.airFriction;

    // Position updates
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // Rotation spin
    this.rotation += Math.hypot(this.vx, this.vy) * 0.06;

    // Motion trail update (stores ground projection + height)
    this.trail.unshift({ x: this.x, y: this.y, z: this.z, alpha: 0.65, radius: this.radius });
    if (this.trail.length > 7) {
      this.trail.pop();
    }
    for (const t of this.trail) {
      t.alpha *= 0.82;
      t.radius *= 0.95;
    }

    // Check which side of net the ball is on
    const previousSide = this.currentSide;
    if (this.x < court.netX) {
      this.currentSide = 'left';
    } else {
      this.currentSide = 'right';
    }

    // 1. Net Crossing & Collision Detection
    // Did ball cross the net plane this frame?
    const crossedNet = (prevX < court.netX && this.x >= court.netX) || (prevX > court.netX && this.x <= court.netX);
    const netYStart = court.courtTop - 18;
    const netYEnd = court.courtBottom + 18;

    if (crossedNet && this.y >= netYStart && this.y <= netYEnd) {
      // Check net height clearance in 3D!
      if (this.z < court.netHeight) {
        // Ball hit the net cord or mesh!
        this.x = prevX;
        this.vx = -this.vx * 0.25;
        this.vy *= 0.4;
        this.vz *= 0.3;
        sound.playNetHit();
        particles.emitNetHit(court.netX, this.y);

        const hitter = this.lastHitBy || 'player1';
        const opponent: PlayerId = hitter === 'player1' ? 'player2' : 'player1';
        return {
          fault: true,
          reason: 'Ball hit the net!',
          winner: opponent
        };
      }
    }

    // When ball safely crosses the net into the other half
    if (previousSide !== null && previousSide !== this.currentSide) {
      this.bounceCountOnSide = 0;
    }

    // 2. Ground Collision & Bounces
    if (this.z <= 0) {
      this.z = 0;
      this.vz = -this.vz * this.restitution;

      if (Math.abs(this.vz) < 1.0) {
        this.vz = 0;
      }

      this.bounceCountOnSide++;
      this.hasBouncedSinceHit = true;
      sound.playBounce(this.vz);
      particles.emitBounce(this.x, this.y);

      // SERVE CHECK: on the first bounce of a serve
      if (this.isServe) {
        this.isServe = false; // Serve has now bounced
        const target = this.targetServiceBox;

        if (target) {
          // Check if serve landed in the Non-Volley Zone (Kitchen)
          const inKitchen =
            this.x >= court.kitchenLeft &&
            this.x <= court.kitchenRight &&
            this.y >= court.courtTop &&
            this.y <= court.courtBottom;

          if (inKitchen) {
            const server = this.lastHitBy || 'player1';
            const opponent: PlayerId = server === 'player1' ? 'player2' : 'player1';
            return {
              fault: true,
              reason: 'Serve landed in Kitchen (NVZ)!',
              winner: opponent
            };
          }

          // Check if serve landed within the diagonal service box
          const inServiceBox =
            this.x >= target.minX &&
            this.x <= target.maxX &&
            this.y >= target.minY &&
            this.y <= target.maxY;

          if (!inServiceBox) {
            const server = this.lastHitBy || 'player1';
            const opponent: PlayerId = server === 'player1' ? 'player2' : 'player1';
            return {
              fault: true,
              reason: 'Fault: Serve landed outside diagonal court!',
              winner: opponent
            };
          }
        }
      }

      // OUT OF BOUNDS CHECK: did the ball bounce outside the outer court lines?
      const inCourt =
        this.x >= court.courtLeft &&
        this.x <= court.courtRight &&
        this.y >= court.courtTop &&
        this.y <= court.courtBottom;

      if (!inCourt) {
        const hitter = this.lastHitBy || 'player1';
        const opponent: PlayerId = hitter === 'player1' ? 'player2' : 'player1';
        return {
          fault: true,
          reason: 'Ball landed out of bounds!',
          winner: opponent
        };
      }

      // DOUBLE BOUNCE CHECK: failed to return before 2nd bounce on same side
      if (this.bounceCountOnSide >= 2) {
        const sideFaultWinner: PlayerId = this.currentSide === 'left' ? 'player2' : 'player1';
        return {
          fault: true,
          reason: 'Double bounce! Point awarded.',
          winner: sideFaultWinner
        };
      }
    }

    return null;
  }

  // Hit the ball with paddle
  public hit(
    player: PlayerId,
    playerVx: number,
    playerVy: number,
    isSmash: boolean,
    particles: ParticleSystem,
    court: CourtDimensions
  ) {
    this.lastHitBy = player;
    this.bounceCountOnSide = 0;
    this.hasBouncedSinceHit = false;
    this.isServe = false;
    this.shotCountInRally++;

    const dirX = player === 'player1' ? 1 : -1;

    // Crosscourt / down-the-line direction influenced by player movement
    const baseSpeedX = isSmash ? 11.5 : 8.8;
    const addedVx = playerVx * 0.35;
    this.vx = (dirX * baseSpeedX) + addedVx;

    // Y velocity directed into opponent court with aim influence
    const targetCenterY = court.centerlineY;
    const aimOffset = (targetCenterY - this.y) * 0.02 + playerVy * 0.4;
    this.vy = aimOffset;

    // 3D Arc: clears the 36px net height
    if (isSmash) {
      // Downward smash
      this.vz = 2.5;
    } else {
      // Standard deep drive or dink with upward arc
      this.vz = 6.8;
    }

    sound.playHit(isSmash ? 1.4 : 1.0);
    particles.emitHit(this.x, this.y, player === 'player1' ? '#38bdf8' : '#fb923c', dirX);
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    // 1. Ground Drop Shadow (Rendered on court floor at x, y)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    const shadowScale = Math.max(0.4, 1 - this.z / 260);
    const shadowRadiusX = (this.radius + 3) * shadowScale;
    const shadowRadiusY = (this.radius + 1) * 0.65 * shadowScale;

    ctx.beginPath();
    ctx.ellipse(this.x, this.y, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Altitude Tether Line (Connects ground shadow to airborne ball when z > 6)
    if (this.z > 6) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y - this.z);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Motion Trail (Airborne)
    ctx.save();
    for (const t of this.trail) {
      ctx.beginPath();
      ctx.arc(t.x, t.y - t.z, t.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(202, 245, 78, ${t.alpha * 0.35})`;
      ctx.fill();
    }
    ctx.restore();

    // 4. Pickleball Sphere in 3D Air (Rendered at x, y - z)
    const renderY = this.y - this.z;
    const renderRadius = this.radius * (1 + this.z / 420);

    ctx.save();
    ctx.translate(this.x, renderY);
    ctx.rotate(this.rotation);

    // Radial gradient for 3D sphere look
    const ballGrad = ctx.createRadialGradient(
      -renderRadius * 0.3,
      -renderRadius * 0.3,
      renderRadius * 0.1,
      0,
      0,
      renderRadius
    );
    ballGrad.addColorStop(0, '#fef08a');
    ballGrad.addColorStop(0.3, '#bef264');
    ballGrad.addColorStop(0.85, '#a3e635');
    ballGrad.addColorStop(1, '#65a30d');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(0, 0, renderRadius, 0, Math.PI * 2);
    ctx.fill();

    // Outer outline
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pickleball Perforations / Holes
    ctx.fillStyle = '#4d7c0f';
    const holeR = renderRadius * 0.16;
    const holeDist = renderRadius * 0.48;
    const angles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];

    for (const a of angles) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * holeDist, Math.sin(a) * holeDist, holeR, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center hole
    ctx.beginPath();
    ctx.arc(0, 0, holeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
