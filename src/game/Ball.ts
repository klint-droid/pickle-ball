import type { Ball, BallTrailPoint, PlayerId, CourtDimensions, CourtSide, BallLandingPrediction, DifficultyLevel } from '../types/game';
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
  public predictedLanding: BallLandingPrediction | null = null;
  public trail: BallTrailPoint[] = [];
  public isActive: boolean = false;

  private restitution: number = 0.74;
  private airFriction: number = 0.997;

  constructor(court: CourtDimensions) {
    this.resetToServe('player1', 'even', court);
  }

  public resetToServe(server: PlayerId, serverCourt: CourtSide, court: CourtDimensions, speedMultiplier: number = 1.0) {
    this.isActive = true;
    this.bounceCountOnSide = 0;
    this.hasBouncedSinceHit = false;
    this.lastHitBy = server;
    this.isServe = true;
    this.shotCountInRally = 0;
    this.trail = [];
    this.z = 18;

    const centerY = court.centerlineY;

    if (server === 'player1') {
      this.currentSide = 'left';
      this.x = court.courtLeft - 10;
      this.y = serverCourt === 'even' ? centerY + 100 : centerY - 100;

      if (serverCourt === 'even') {
        this.targetServiceBox = {
          minX: court.kitchenRight,
          maxX: court.courtRight,
          minY: court.courtTop,
          maxY: centerY
        };
      } else {
        this.targetServiceBox = {
          minX: court.kitchenRight,
          maxX: court.courtRight,
          minY: centerY,
          maxY: court.courtBottom
        };
      }

      const targetX = (this.targetServiceBox.minX + this.targetServiceBox.maxX) / 2;
      const targetY = (this.targetServiceBox.minY + this.targetServiceBox.maxY) / 2;
      const flightFrames = Math.round(48 / speedMultiplier);

      this.vx = (targetX - this.x) / flightFrames;
      this.vy = (targetY - this.y) / flightFrames;
      this.vz = 7.8;
    } else {
      this.currentSide = 'right';
      this.x = court.courtRight + 10;
      this.y = serverCourt === 'even' ? centerY - 100 : centerY + 100;

      if (serverCourt === 'even') {
        this.targetServiceBox = {
          minX: court.courtLeft,
          maxX: court.kitchenLeft,
          minY: centerY,
          maxY: court.courtBottom
        };
      } else {
        this.targetServiceBox = {
          minX: court.courtLeft,
          maxX: court.kitchenLeft,
          minY: court.courtTop,
          maxY: centerY
        };
      }

      const targetX = (this.targetServiceBox.minX + this.targetServiceBox.maxX) / 2;
      const targetY = (this.targetServiceBox.minY + this.targetServiceBox.maxY) / 2;
      const flightFrames = Math.round(48 / speedMultiplier);

      this.vx = (targetX - this.x) / flightFrames;
      this.vy = (targetY - this.y) / flightFrames;
      this.vz = 7.8;
    }

    sound.playHit(0.95);
    this.updateLandingPrediction();
  }

  private updateLandingPrediction() {
    if (this.z <= 0 || !this.isActive) {
      this.predictedLanding = null;
      return;
    }

    // Trajectory solver: calculate frames until z reaches 0
    const disc = this.vz * this.vz + 2 * this.gravity * this.z;
    if (disc < 0) {
      this.predictedLanding = null;
      return;
    }

    const t = (this.vz + Math.sqrt(disc)) / this.gravity;
    if (t <= 0 || isNaN(t)) {
      this.predictedLanding = null;
      return;
    }

    const landingX = this.x + this.vx * t;
    const landingY = this.y + this.vy * t;

    this.predictedLanding = {
      x: landingX,
      y: landingY,
      framesRemaining: Math.round(t),
      totalFlightFrames: 50
    };
  }

  public update(court: CourtDimensions, particles: ParticleSystem): {
    fault: boolean;
    reason: string;
    winner: PlayerId | null;
  } | null {
    if (!this.isActive) return null;

    const prevX = this.x;

    // Apply gravity
    this.vz -= this.gravity;

    // Air friction
    this.vx *= this.airFriction;
    this.vy *= this.airFriction;

    // Position updates
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // Update rotation
    this.rotation += Math.hypot(this.vx, this.vy) * 0.06;

    // Motion trail
    this.trail.unshift({ x: this.x, y: this.y, z: this.z, alpha: 0.65, radius: this.radius });
    if (this.trail.length > 7) {
      this.trail.pop();
    }
    for (const t of this.trail) {
      t.alpha *= 0.82;
      t.radius *= 0.95;
    }

    // Update court landing prediction
    this.updateLandingPrediction();

    // Check which side of net
    const previousSide = this.currentSide;
    if (this.x < court.netX) {
      this.currentSide = 'left';
    } else {
      this.currentSide = 'right';
    }

    // Net crossing check
    const crossedNet = (prevX < court.netX && this.x >= court.netX) || (prevX > court.netX && this.x <= court.netX);
    const netYStart = court.courtTop - 18;
    const netYEnd = court.courtBottom + 18;

    if (crossedNet && this.y >= netYStart && this.y <= netYEnd) {
      if (this.z < court.netHeight) {
        this.x = prevX;
        this.vx = -this.vx * 0.25;
        this.vy *= 0.4;
        this.vz *= 0.3;
        this.predictedLanding = null;
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

    if (previousSide !== null && previousSide !== this.currentSide) {
      this.bounceCountOnSide = 0;
    }

    // Ground Bounces
    if (this.z <= 0) {
      this.z = 0;
      this.vz = -this.vz * this.restitution;

      if (Math.abs(this.vz) < 1.0) {
        this.vz = 0;
      }

      this.bounceCountOnSide++;
      this.hasBouncedSinceHit = true;
      this.predictedLanding = null;
      sound.playBounce(this.vz);
      particles.emitBounce(this.x, this.y);

      // SERVE CHECK
      if (this.isServe) {
        this.isServe = false;
        const target = this.targetServiceBox;

        if (target) {
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

      // OUT OF BOUNDS CHECK
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

      // DOUBLE BOUNCE CHECK
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
    court: CourtDimensions,
    speedMultiplier: number = 1.0,
    difficulty: DifficultyLevel = 'medium',
    isAI: boolean = false
  ) {
    this.lastHitBy = player;
    this.bounceCountOnSide = 0;
    this.hasBouncedSinceHit = false;
    this.isServe = false;
    this.shotCountInRally++;

    const dirX = player === 'player1' ? 1 : -1;

    // Check for AI unforced hitting mistakes
    let aiMistake: 'none' | 'net' | 'long' | 'wide' = 'none';

    if (isAI) {
      const rallyPressure = Math.min(0.12, this.shotCountInRally * 0.015);
      let errorChance = 0;

      if (difficulty === 'easy') {
        errorChance = 0.16 + rallyPressure;
      } else if (difficulty === 'medium') {
        errorChance = 0.07 + rallyPressure * 0.6;
      } else {
        errorChance = 0.02 + rallyPressure * 0.3;
      }

      if (isSmash) {
        errorChance += 0.04;
      }

      if (Math.random() < errorChance) {
        const roll = Math.random();
        if (roll < 0.40) {
          aiMistake = 'net'; // Hits into the net mesh!
        } else if (roll < 0.72) {
          aiMistake = 'long'; // Overhits deep past baseline!
        } else {
          aiMistake = 'wide'; // Slices wide past sideline!
        }
      }
    }

    if (aiMistake === 'net') {
      // Hit low into net
      this.vx = -8.6 * speedMultiplier;
      this.vy = (court.centerlineY - this.y) * 0.015;
      this.vz = 5.4; // Arrives at net with altitude below 36px net height
    } else if (aiMistake === 'long') {
      // Overhit drive that sails past baseline
      this.vx = -12.4 * speedMultiplier;
      this.vy = (court.centerlineY - this.y) * 0.01;
      this.vz = 8.6;
    } else if (aiMistake === 'wide') {
      // Sliced wide past sideline
      const side = Math.random() > 0.5 ? 1 : -1;
      this.vx = -8.2 * speedMultiplier;
      this.vy = side * 5.2 * speedMultiplier;
      this.vz = 6.4;
    } else {
      const baseSpeedX = (isSmash ? 11.5 : 8.8) * speedMultiplier;
      const addedVx = playerVx * 0.35;
      this.vx = (dirX * baseSpeedX) + addedVx;

      if (isAI) {
        // Natural crosscourt / down-the-line aiming with safe margins
        const targetY = court.centerlineY + (Math.random() - 0.5) * (court.courtHeight * 0.50);
        this.vy = (targetY - this.y) * 0.022 * speedMultiplier;
      } else {
        const targetCenterY = court.centerlineY;
        const aimOffset = (targetCenterY - this.y) * 0.02 + playerVy * 0.4;
        this.vy = aimOffset * speedMultiplier;
      }

      if (isSmash) {
        this.vz = 2.5;
      } else {
        this.vz = 6.8;
      }
    }

    sound.playHit(isSmash ? 1.4 : 1.0);
    particles.emitHit(this.x, this.y, player === 'player1' ? '#38bdf8' : '#fb923c', dirX);
    this.updateLandingPrediction();
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    // 1. Dynamic Court Landing Predictor Marker (UX Hit Assistant)
    if (this.predictedLanding && this.z > 8) {
      this.renderLandingPredictor(ctx);
    }

    // 2. Ground Drop Shadow (Rendered on court floor at x, y)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    const shadowScale = Math.max(0.4, 1 - this.z / 260);
    const shadowRadiusX = (this.radius + 3) * shadowScale;
    const shadowRadiusY = (this.radius + 1) * 0.65 * shadowScale;

    ctx.beginPath();
    ctx.ellipse(this.x, this.y, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Altitude Tether Line (Connects ground shadow to airborne ball when z > 6)
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

    // 4. Motion Trail
    ctx.save();
    for (const t of this.trail) {
      ctx.beginPath();
      ctx.arc(t.x, t.y - t.z, t.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(202, 245, 78, ${t.alpha * 0.35})`;
      ctx.fill();
    }
    ctx.restore();

    // 5. Pickleball Sphere in 3D Air (Rendered at x, y - z)
    const renderY = this.y - this.z;
    const renderRadius = this.radius * (1 + this.z / 420);

    ctx.save();
    ctx.translate(this.x, renderY);
    ctx.rotate(this.rotation);

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

    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#4d7c0f';
    const holeR = renderRadius * 0.16;
    const holeDist = renderRadius * 0.48;
    const angles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];

    for (const a of angles) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * holeDist, Math.sin(a) * holeDist, holeR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, holeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Render ground landing crosshair with shrinking timing ring
  private renderLandingPredictor(ctx: CanvasRenderingContext2D) {
    if (!this.predictedLanding) return;
    const { x, y, framesRemaining } = this.predictedLanding;

    ctx.save();

    // Color cue: Cyan if on Player 1 side, Coral if on Player 2 side
    const isP1Side = x < 640;
    const color = isP1Side ? '#38bdf8' : '#fb923c';

    // 1. Center Target Crosshair
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    const crossSize = 7;
    ctx.beginPath();
    ctx.moveTo(x - crossSize, y);
    ctx.lineTo(x + crossSize, y);
    ctx.moveTo(x, y - crossSize);
    ctx.lineTo(x, y + crossSize);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Inward-shrinking arrival timing ring
    // Starts at 26px radius and closes to 6px as framesRemaining approaches 0
    const timingRadius = Math.max(7, Math.min(32, 6 + framesRemaining * 0.75));
    ctx.strokeStyle = `rgba(${isP1Side ? '56, 189, 248' : '251, 146, 60'}, 0.75)`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.ellipse(x, y, timingRadius, timingRadius * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Subtle outer bounce pulse halo
    ctx.fillStyle = `rgba(${isP1Side ? '56, 189, 248' : '251, 146, 60'}, 0.12)`;
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
