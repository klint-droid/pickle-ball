import type { Player, PlayerId, CourtDimensions } from '../types/game';
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

  constructor(id: PlayerId, court: CourtDimensions) {
    this.id = id;

    if (id === 'player1') {
      this.name = 'Player 1';
      this.angle = 0; // Facing right towards net
      this.bodyColor = '#38bdf8'; // Sky blue
      this.shirtColor = '#0284c7';
      this.paddleColor = '#0ea5e9';

      this.minX = court.courtLeft - 50;
      this.maxX = court.netX - 10;
      this.x = court.courtLeft + 60;
      this.y = court.centerlineY + 80;
    } else {
      this.name = 'Player 2';
      this.angle = Math.PI; // Facing left towards net
      this.bodyColor = '#fb923c'; // Coral / Amber
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

  // Update position following mouse hover directly
  public updateWithMouse(mouseX: number, mouseY: number, justHit: boolean, ballX: number, ballY: number) {
    const prevX = this.x;
    const prevY = this.y;

    // Smooth yet ultra-responsive mouse tracking (e.g. air hockey / paddle cursor feel)
    const targetX = Math.max(this.minX, Math.min(this.maxX, mouseX));
    const targetY = Math.max(this.minY, Math.min(this.maxY, mouseY));

    // Smooth interpolation with high coefficient for crisp tracking
    this.x += (targetX - this.x) * 0.55;
    this.y += (targetY - this.y) * 0.55;

    this.velocityX = this.x - prevX;
    this.velocityY = this.y - prevY;

    // Face towards the ball
    this.faceTowards(ballX, ballY);

    // Hit / Swing execution
    this.handleHit(justHit);
  }

  // Update with 2D Keyboard input (WASD or Arrows)
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

  // Smart AI Opponent for Player 2
  public updateAI(
    ballX: number,
    ballY: number,
    ballZ: number,
    ballVx: number,
    ballHasBounced: boolean,
    shotCount: number,
    court: CourtDimensions
  ): boolean {
    let shouldHit = false;
    let targetX = this.x;
    let targetY = this.y;

    const isBallApproaching = ballVx > 0;
    const centerY = court.centerlineY;

    if (isBallApproaching) {
      // Predict intercept point
      targetY = ballY;

      // TWO-BOUNCE RULE AWARENESS:
      // If serve return (shot 0) or 3rd shot (shot 1), AI MUST wait for bounce before volleying
      const mustWaitForBounce = (shotCount === 0 || shotCount === 1) && !ballHasBounced;

      if (mustWaitForBounce) {
        // Stay back near baseline waiting for bounce
        targetX = court.courtRight - 60;
      } else {
        // KITCHEN RULE AWARENESS:
        // Do not advance into kitchen unless ball already bounced inside kitchen
        const ballBouncedInKitchen = ballHasBounced && ballX >= court.kitchenRight;
        if (!ballBouncedInKitchen) {
          // Stay just behind kitchen line (safe volley position)
          const safeLine = court.kitchenRight + 24;
          targetX = Math.max(safeLine, Math.min(court.courtRight - 30, ballX));
        } else {
          // Step forward to dink
          targetX = ballX;
        }
      }

      // Check if ball is in paddle hit reach
      const paddlePos = this.getPaddleHitCenter();
      const dist = Math.hypot(ballX - paddlePos.x, ballY - paddlePos.y);

      if (dist < 46 && ballZ < 70) {
        if (!mustWaitForBounce) {
          // If in kitchen, only hit if ball has already bounced
          if (!this.isInKitchen(court) || ballHasBounced) {
            shouldHit = true;
          }
        } else if (ballHasBounced) {
          shouldHit = true;
        }
      }
    } else {
      // Ball is moving away: reset to optimal ready position
      targetX = court.courtRight - 80;
      targetY = centerY;
    }

    // Move AI smoothly toward target position
    const aiSpeed = 4.8;
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

    // Clamp
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

    // 1. Soft drop shadow on the court
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate player model towards aim angle
    ctx.rotate(this.angle);

    // 2. Athletic Shoulders & Torso (Top-Down)
    ctx.fillStyle = this.shirtColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Sport Jersey Number on back
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.id === 'player1' ? '1' : '2', 0, 4);
    ctx.restore();

    // 4. Head & Sport Cap (Top-Down)
    const headRadius = 9;
    ctx.fillStyle = '#fed7aa'; // Skin tone
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cap / Headband
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, headRadius + 0.5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headRadius + 2, 0, 3.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Arm & Pickleball Paddle
    this.renderPaddle(ctx);

    ctx.restore();
  }

  private renderPaddle(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(6, 8);
    ctx.rotate(this.paddleAngle);

    // Arm
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    // Paddle Handle
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(21, 0);
    ctx.stroke();

    // Paddle Blade
    ctx.translate(21, 0);
    ctx.fillStyle = this.paddleColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(0, -9, 16, 18, 4);
    ctx.fill();
    ctx.stroke();

    // Swing Blur / Hit Reach Ring indicator during active hit
    if (this.isHitting) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, 28, -0.6, 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }
}
