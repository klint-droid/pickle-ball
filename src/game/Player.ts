import type { Player, PlayerId, CourtDimensions, DifficultyLevel } from '../types/game';
import type { PlayerInput } from './Input';

export class PlayerCharacter implements Player {
  public id: PlayerId;
  public name: string;
  public x: number = 0;
  public y: number = 0;
  public width: number = 32;
  public height: number = 32;
  public velocityX: number = 0;
  public velocityY: number = 0;
  public speed: number = 5.8;
  public angle: number = 0;
  public isHitting: boolean = false;
  public hitTimer: number = 0;
  public paddleAngle: number = 0;
  public bodyColor: string;
  public shirtColor: string;
  public paddleColor: string;

  private minX: number = 0;
  private maxX: number = 0;
  private minY: number = 0;
  private maxY: number = 0;

  // AI Human Imperfection & Reaction State
  private aiReactionDelayFrames: number = 0;
  private aiTargetOffsetY: number = 0;
  private aiWillCommitRuleFault: boolean = false;
  private aiLastBallVx: number = 0;

  constructor(id: PlayerId, court: CourtDimensions) {
    this.id = id;

    if (id === 'player1') {
      this.name = 'Player 1';
      this.angle = 0;
      this.bodyColor = '#38bdf8';
      this.shirtColor = '#0284c7';
      this.paddleColor = '#0ea5e9';

      this.minX = court.courtLeft - 50;
      this.maxX = court.netX - 10;
      this.x = court.courtLeft + 60;
      this.y = court.centerlineY + 80;
    } else {
      this.name = 'Player 2';
      this.angle = Math.PI;
      this.bodyColor = '#fb923c';
      this.shirtColor = '#ea580c';
      this.paddleColor = '#f97316';

      this.minX = court.netX + 10;
      this.maxX = court.courtRight + 50;
      this.x = court.courtRight - 60;
      this.y = court.centerlineY - 80;
    }

    this.minY = court.courtTop - 40;
    this.maxY = court.courtBottom + 40;
  }

  public resetPosition(court: CourtDimensions, isServing: boolean, serverCourt: 'even' | 'odd') {
    this.velocityY = 0;
    this.velocityX = 0;
    this.isHitting = false;
    this.hitTimer = 0;

    this.aiReactionDelayFrames = 0;
    this.aiTargetOffsetY = 0;
    this.aiWillCommitRuleFault = false;
    this.aiLastBallVx = 0;

    const centerY = court.centerlineY;
    const targetY = serverCourt === 'even' ? centerY + 100 : centerY - 100;

    if (this.id === 'player1') {
      this.angle = 0;
      if (isServing) {
        this.x = court.courtLeft - 20;
        this.y = targetY;
      } else {
        this.x = court.courtLeft + 40;
        this.y = serverCourt === 'even' ? centerY - 100 : centerY + 100;
      }
    } else {
      this.angle = Math.PI;
      if (isServing) {
        this.x = court.courtRight + 20;
        this.y = serverCourt === 'even' ? centerY - 100 : centerY + 100;
      } else {
        this.x = court.courtRight - 40;
        this.y = targetY;
      }
    }
  }

  public isInKitchen(court: CourtDimensions): boolean {
    const buffer = 14;
    return (
      this.x + buffer > court.kitchenLeft &&
      this.x - buffer < court.kitchenRight &&
      this.y + buffer > court.courtTop &&
      this.y - buffer < court.courtBottom
    );
  }

  public updateWithMouse(mouseX: number, mouseY: number, justHit: boolean, ballX: number, ballY: number) {
    const prevX = this.x;
    const prevY = this.y;

    const targetX = Math.max(this.minX, Math.min(this.maxX, mouseX));
    const targetY = Math.max(this.minY, Math.min(this.maxY, mouseY));

    this.x += (targetX - this.x) * 0.58;
    this.y += (targetY - this.y) * 0.58;

    this.velocityX = this.x - prevX;
    this.velocityY = this.y - prevY;

    this.faceTowards(ballX, ballY);
    this.handleHit(justHit);
  }

  public updateWithKeyboard(input: PlayerInput, ballX: number, ballY: number) {
    let dx = 0;
    let dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.SQRT2;
      dx *= invLen;
      dy *= invLen;
    }

    this.velocityX = dx * this.speed;
    this.velocityY = dy * this.speed;

    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX) this.x = this.maxX;
    if (this.y < this.minY) this.y = this.minY;
    if (this.y > this.maxY) this.y = this.maxY;

    this.faceTowards(ballX, ballY);
    this.handleHit(input.justHit);
  }

  // Smart AI Opponent with Difficulty Tuning
  public updateAI(
    ballX: number,
    ballY: number,
    ballZ: number,
    ballVx: number,
    ballHasBounced: boolean,
    shotCount: number,
    court: CourtDimensions,
    difficulty: DifficultyLevel = 'medium'
  ): boolean {
    let shouldHit = false;
    let targetX = this.x;
    let targetY = this.y;

    const isBallApproaching = ballVx > 0;
    const justHitTowardsAI = isBallApproaching && this.aiLastBallVx <= 0;
    this.aiLastBallVx = ballVx;

    // Difficulty-tuned AI speed and reach
    const aiSpeed = difficulty === 'easy' ? 3.8 : difficulty === 'medium' ? 4.9 : 6.2;
    const aiReach = difficulty === 'easy' ? 42 : difficulty === 'medium' ? 46 : 52;
    const centerY = court.centerlineY;

    if (justHitTowardsAI) {
      // Roll AI decision & mistakes for this incoming shot
      const rallyPressure = Math.min(0.12, shotCount * 0.015);

      if (difficulty === 'easy') {
        // Natural human reaction latency (3-6 frames)
        this.aiReactionDelayFrames = 3 + Math.floor(Math.random() * 4);

        // 22% chance of misjudging Y arrival position
        if (Math.random() < 0.22 + rallyPressure) {
          const dir = Math.random() > 0.5 ? 1 : -1;
          this.aiTargetOffsetY = dir * (26 + Math.random() * 26);
        } else {
          this.aiTargetOffsetY = (Math.random() - 0.5) * 10;
        }

        // 5% chance to slip up on a rule (kitchen or two-bounce fault)
        this.aiWillCommitRuleFault = Math.random() < 0.05;
      } else if (difficulty === 'medium') {
        // Subtle human reaction latency (1-3 frames)
        this.aiReactionDelayFrames = 1 + Math.floor(Math.random() * 3);

        // 9% chance of misjudging arrival position under pressure
        if (Math.random() < 0.09 + rallyPressure * 0.6) {
          const dir = Math.random() > 0.5 ? 1 : -1;
          this.aiTargetOffsetY = dir * (16 + Math.random() * 16);
        } else {
          this.aiTargetOffsetY = (Math.random() - 0.5) * 6;
        }

        // 1.5% chance to slip up on a rule
        this.aiWillCommitRuleFault = Math.random() < 0.015;
      } else {
        // Hard difficulty: sharp and focused
        this.aiReactionDelayFrames = 0;
        if (Math.random() < 0.025 + rallyPressure * 0.3) {
          this.aiTargetOffsetY = (Math.random() - 0.5) * 14;
        } else {
          this.aiTargetOffsetY = 0;
        }
        this.aiWillCommitRuleFault = false;
      }
    }

    if (isBallApproaching) {
      if (this.aiReactionDelayFrames > 0) {
        this.aiReactionDelayFrames--;
        targetX = this.x;
        targetY = this.y;
      } else {
        targetY = ballY + this.aiTargetOffsetY;
        targetY = Math.max(court.courtTop + 15, Math.min(court.courtBottom - 15, targetY));

        const mustWaitForBounce = (shotCount === 0 || shotCount === 1) && !ballHasBounced;

        if (mustWaitForBounce && !this.aiWillCommitRuleFault) {
          targetX = court.courtRight - 60;
        } else if (mustWaitForBounce && this.aiWillCommitRuleFault) {
          // Mistake: AI gets too eager and rushes to volley serve
          targetX = ballX;
        } else {
          const ballBouncedInKitchen = ballHasBounced && ballX >= court.kitchenRight;
          if (!ballBouncedInKitchen && !this.aiWillCommitRuleFault) {
            const safeLine = court.kitchenRight + 24;
            targetX = Math.max(safeLine, Math.min(court.courtRight - 30, ballX));
          } else {
            targetX = ballX;
          }
        }
      }

      const paddlePos = this.getPaddleHitCenter();
      const dist = Math.hypot(ballX - paddlePos.x, ballY - paddlePos.y);

      if (dist < aiReach && ballZ < 72) {
        const mustWaitForBounce = (shotCount === 0 || shotCount === 1) && !ballHasBounced;
        if (this.aiWillCommitRuleFault) {
          // AI swings prematurely, committing authentic fault
          shouldHit = true;
        } else if (!mustWaitForBounce) {
          if (!this.isInKitchen(court) || ballHasBounced) {
            shouldHit = true;
          }
        } else if (ballHasBounced) {
          shouldHit = true;
        }
      }
    } else {
      targetX = court.courtRight - 80;
      targetY = centerY;
      this.aiReactionDelayFrames = 0;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      this.velocityX = (dx / dist) * Math.min(aiSpeed, dist);
      this.velocityY = (dy / dist) * Math.min(aiSpeed, dist);
      this.x += this.velocityX;
      this.y += this.velocityY;
    } else {
      this.velocityX = 0;
      this.velocityY = 0;
    }

    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX) this.x = this.maxX;
    if (this.y < this.minY) this.y = this.minY;
    if (this.y > this.maxY) this.y = this.maxY;

    this.faceTowards(ballX, ballY);
    this.handleHit(shouldHit);

    return shouldHit;
  }

  private faceTowards(targetX: number, targetY: number) {
    const targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * 0.25;
  }

  private handleHit(triggerHit: boolean) {
    if (triggerHit && !this.isHitting) {
      this.isHitting = true;
      this.hitTimer = 14;
    }

    if (this.isHitting) {
      this.hitTimer--;
      const progress = 1 - (this.hitTimer / 14);
      this.paddleAngle = -0.5 + progress * 1.8;
      if (this.hitTimer <= 0) {
        this.isHitting = false;
        this.paddleAngle = 0;
      }
    } else {
      this.paddleAngle = 0;
    }
  }

  public getPaddleHitCenter(): { x: number; y: number } {
    const reach = 34;
    const swingAngle = this.angle + this.paddleAngle * 0.6;
    return {
      x: this.x + Math.cos(swingAngle) * reach,
      y: this.y + Math.sin(swingAngle) * reach
    };
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(this.angle);

    // Torso
    ctx.fillStyle = this.shirtColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jersey Number
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.id === 'player1' ? '1' : '2', 0, 4);
    ctx.restore();

    // Head & Cap
    const headRadius = 9;
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, headRadius + 0.5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headRadius + 2, 0, 3.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    this.renderPaddle(ctx);

    ctx.restore();
  }

  private renderPaddle(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(6, 8);
    ctx.rotate(this.paddleAngle);

    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(21, 0);
    ctx.stroke();

    ctx.translate(21, 0);
    ctx.fillStyle = this.paddleColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(0, -9, 16, 18, 4);
    ctx.fill();
    ctx.stroke();

    if (this.isHitting) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, 28, -0.6, 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Hit-Assist Indicator Halo around Player 1 paddle
  public renderHitIndicator(
    ctx: CanvasRenderingContext2D,
    status: 'ready' | 'approaching' | 'warn-bounce' | 'idle',
    reachRadius: number
  ) {
    if (status === 'idle') return;

    const paddlePos = this.getPaddleHitCenter();
    ctx.save();

    if (status === 'ready') {
      // 🟢 Ready to hit: Vibrant neon green pulse with HIT prompt
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(paddlePos.x, paddlePos.y, reachRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';
      ctx.fill();

      // "HIT!" badge above paddle
      ctx.shadowBlur = 0;
      ctx.font = '800 12px Outfit, system-ui, sans-serif';
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'center';
      ctx.fillText('HIT NOW!', paddlePos.x, paddlePos.y - reachRadius - 8);
    } else if (status === 'warn-bounce') {
      // 🔴 Illegal volley warning (Kitchen or Two-Bounce): Red warning
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(paddlePos.x, paddlePos.y, reachRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '800 11px Outfit, system-ui, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText('WAIT FOR BOUNCE!', paddlePos.x, paddlePos.y - reachRadius - 8);
    } else if (status === 'approaching') {
      // 🟡 Ball approaching: Gentle cyan range guide
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(paddlePos.x, paddlePos.y, reachRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
