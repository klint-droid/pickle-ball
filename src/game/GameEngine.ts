import type { GameState, GameScore, PlayerId, CourtSide, ScoringMode, DifficultyLevel } from '../types/game';
import { Court } from './Court';
import { PlayerCharacter } from './Player';
import { BallEntity } from './Ball';
import { ParticleSystem } from './Particles';
import { InputManager } from './Input';
import { sound } from './Audio';

export class GameEngine {
  public state: GameState = 'menu';
  public court: Court;
  public player1: PlayerCharacter;
  public player2: PlayerCharacter;
  public ball: BallEntity;
  public particles: ParticleSystem;
  public input: InputManager;

  public score: GameScore = {
    player1: 0,
    player2: 0,
    rally: 0,
    server: 'player1',
    serverCourt: 'even',
    scoringMode: 'side-out',
    difficulty: 'medium',
    isSideOut: false,
    pointWinner: null,
    pointReason: '',
    serveCountdown: null,
    winner: null
  };

  private pointCooldownTimer: number = 0;
  private serveCountdownFrames: number = 0;
  private currentCountdownSecond: number | null = null;
  private onStateChange: ((state: GameState, score: GameScore) => void) | null = null;
  private hitReach: number = 50;
  private p1HitStatus: 'ready' | 'approaching' | 'warn-bounce' | 'idle' = 'idle';
  private isP2AI: boolean = true;

  constructor(canvasWidth: number = 1280, canvasHeight: number = 720) {
    this.court = new Court(canvasWidth, canvasHeight);
    this.player1 = new PlayerCharacter('player1', this.court.dims);
    this.player2 = new PlayerCharacter('player2', this.court.dims);
    this.ball = new BallEntity(this.court.dims);
    this.particles = new ParticleSystem();
    this.input = new InputManager();

    this.input.setOnEscape(() => {
      this.togglePause();
    });
  }

  public setDifficulty(diff: DifficultyLevel) {
    this.score.difficulty = diff;
    if (diff === 'easy') {
      this.hitReach = 56;
    } else if (diff === 'medium') {
      this.hitReach = 50;
    } else {
      this.hitReach = 45;
    }
    this.notify();
  }

  public getSpeedMultiplier(): number {
    // Ball speed and physics are normal regulation across all levels
    return 1.0;
  }

  public setListener(cb: (state: GameState, score: GameScore) => void) {
    this.onStateChange = cb;
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange(this.state, { ...this.score });
    }
  }

  public setScoringMode(mode: ScoringMode) {
    this.score.scoringMode = mode;
    this.notify();
  }

  private computeServerCourt(): CourtSide {
    const serverScore = this.score.server === 'player1' ? this.score.player1 : this.score.player2;
    return serverScore % 2 === 0 ? 'even' : 'odd';
  }

  public startMatch() {
    this.score = {
      ...this.score,
      player1: 0,
      player2: 0,
      rally: 0,
      server: 'player1',
      serverCourt: 'even',
      isSideOut: false,
      pointWinner: null,
      pointReason: '',
      serveCountdown: null,
      winner: null
    };

    this.input.start();
    this.startServeCountdown();
  }

  private startServeCountdown() {
    this.p1HitStatus = 'idle';
    this.particles.clear();
    const courtSide = this.computeServerCourt();
    this.score.serverCourt = courtSide;

    const isP1Server = this.score.server === 'player1';
    this.player1.resetPosition(this.court.dims, isP1Server, courtSide);
    this.player2.resetPosition(this.court.dims, !isP1Server, courtSide);

    // Ball held stationary at server's hand during countdown
    this.ball.isActive = true;
    if (isP1Server) {
      this.ball.x = this.player1.x + 18;
      this.ball.y = this.player1.y;
    } else {
      this.ball.x = this.player2.x - 18;
      this.ball.y = this.player2.y;
    }
    this.ball.z = 18;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;

    // Start 3-second countdown (180 frames at 60fps)
    this.serveCountdownFrames = 180;
    this.currentCountdownSecond = 3;
    this.score.serveCountdown = 3;
    sound.playCountdownTick(3);

    this.state = 'playing';
    this.notify();
  }

  public executeServe() {
    this.serveCountdownFrames = 0;
    this.score.serveCountdown = null;
    this.currentCountdownSecond = null;
    sound.playServeWhistle();
    this.ball.resetToServe(this.score.server, this.score.serverCourt, this.court.dims, this.getSpeedMultiplier());
    this.notify();
  }

  public togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.notify();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.notify();
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.notify();
    }
  }

  public goToMenu() {
    this.state = 'menu';
    this.input.stop();
    this.notify();
  }

  public restartMatch() {
    this.startMatch();
  }

  public update() {
    if (this.state === 'gameOver') {
      this.particles.update();
      return;
    }

    if (this.state === 'paused' || this.state === 'menu') {
      return;
    }

    if (this.state === 'point') {
      this.particles.update();
      this.pointCooldownTimer--;
      if (this.pointCooldownTimer <= 0) {
        this.nextPoint();
      }
      return;
    }

    // Pre-Serve Countdown State (3, 2, 1...)
    if (this.serveCountdownFrames > 0) {
      const p1Input = this.input.getPlayer1Input();
      // Allow Player 1 to position paddle smoothly with mouse hover or touch
      this.player1.updateWithMouse(this.input.mouseX, this.input.mouseY, p1Input.justHit, this.ball.x, this.ball.y);

      // Keep ball in server's hand while countdown is active
      const isP1Server = this.score.server === 'player1';
      if (isP1Server) {
        this.ball.x = this.player1.x + 18;
        this.ball.y = this.player1.y;
      } else {
        this.ball.x = this.player2.x - 18;
        this.ball.y = this.player2.y;
      }

      // Tap, click, or space during countdown launches serve immediately
      if (p1Input.justHit || this.input.mouseJustClicked) {
        this.executeServe();
        this.input.endFrame();
        return;
      }

      this.serveCountdownFrames--;
      const sec = Math.ceil(this.serveCountdownFrames / 60);

      if (sec !== this.currentCountdownSecond && sec > 0) {
        this.currentCountdownSecond = sec;
        this.score.serveCountdown = sec;
        sound.playCountdownTick(sec);
        this.notify();
      }

      if (this.serveCountdownFrames <= 0) {
        this.executeServe();
      }

      this.input.endFrame();
      return;
    }

    // Active Match In-Flight Updates
    const p1Input = this.input.getPlayer1Input();
    const p2Input = this.input.getPlayer2Input();

    // 1. Update Player 1 with Mouse Hover Movement
    this.player1.updateWithMouse(this.input.mouseX, this.input.mouseY, p1Input.justHit, this.ball.x, this.ball.y);

    // Calculate Hit-Assist Status for Player 1
    const p1Paddle = this.player1.getPaddleHitCenter();
    const p1Dist = Math.hypot(this.ball.x - p1Paddle.x, this.ball.y - p1Paddle.y);
    const isVolley = !this.ball.hasBouncedSinceHit;
    const isIllegalVolley = isVolley && (
      this.ball.shotCountInRally === 0 ||
      this.ball.shotCountInRally === 1 ||
      this.player1.isInKitchen(this.court.dims)
    );

    if (!this.ball.isActive || (this.ball.vx > 0.5 && this.ball.x > this.court.dims.courtRight - 80)) {
      this.p1HitStatus = 'idle';
    } else if (p1Dist <= this.hitReach && this.ball.z < 75) {
      this.p1HitStatus = isIllegalVolley ? 'warn-bounce' : 'ready';
    } else if (p1Dist <= this.hitReach * 1.85 && (this.ball.vx < 0 || this.ball.x < this.court.dims.netX)) {
      this.p1HitStatus = isIllegalVolley ? 'warn-bounce' : 'approaching';
    } else {
      this.p1HitStatus = 'idle';
    }

    // Auto-hit if mouse paddle collides directly with ball, but ONLY if legal!
    // Never auto-volley when an illegal volley fault would occur (wait for the ball to bounce first).
    const isP1HoverContact = !isIllegalVolley && p1Dist <= 32 && this.ball.z < 65 && this.ball.currentSide === 'left';
    const p1ShouldHit = p1Input.justHit || isP1HoverContact;
    this.checkPlayerHit('player1', this.player1, p1ShouldHit);

    // 2. Update Player 2: Human Keyboard or Smart Pickleball AI
    const isP2Human = p2Input.left || p2Input.right || p2Input.up || p2Input.down || p2Input.justHit;
    if (isP2Human) {
      this.isP2AI = false;
      this.player2.updateWithKeyboard(p2Input, this.ball.x, this.ball.y);
      this.checkPlayerHit('player2', this.player2, p2Input.justHit);
    } else {
      this.isP2AI = true;
      const aiSwung = this.player2.updateAI(
        this.ball.x,
        this.ball.y,
        this.ball.z,
        this.ball.vx,
        this.ball.hasBouncedSinceHit,
        this.ball.shotCountInRally,
        this.court.dims,
        this.score.difficulty
      );
      if (aiSwung) {
        this.checkPlayerHit('player2', this.player2, true);
      }
    }

    // 3. Update 3D Ball Physics & Faults
    const fault = this.ball.update(this.court.dims, this.particles);
    if (fault && fault.fault) {
      this.awardFault(fault.winner, fault.reason);
    }

    // 4. Update Particles
    this.particles.update();

    // 5. Clear frame input triggers
    this.input.endFrame();
  }

  private checkPlayerHit(id: PlayerId, player: PlayerCharacter, justHit: boolean) {
    if (!justHit || !this.ball.isActive) return;

    const hitCenter = player.getPaddleHitCenter();
    const dist2D = Math.hypot(this.ball.x - hitCenter.x, this.ball.y - hitCenter.y);

    if (dist2D <= this.hitReach && this.ball.z < 75) {
      const isVolley = !this.ball.hasBouncedSinceHit;

      // RULE 1: TWO-BOUNCE RULE
      if (isVolley) {
        if (this.ball.shotCountInRally === 0) {
          const opponent: PlayerId = id === 'player1' ? 'player2' : 'player1';
          this.awardFault(opponent, 'Two-Bounce Fault: Receiver must let serve bounce!');
          return;
        }

        if (this.ball.shotCountInRally === 1) {
          const opponent: PlayerId = id === 'player1' ? 'player2' : 'player1';
          this.awardFault(opponent, 'Two-Bounce Fault: Server must let return bounce!');
          return;
        }
      }

      // RULE 2: NON-VOLLEY ZONE (KITCHEN) RULE
      if (isVolley && player.isInKitchen(this.court.dims)) {
        const opponent: PlayerId = id === 'player1' ? 'player2' : 'player1';
        this.awardFault(opponent, 'Kitchen Fault: Volleyed inside Non-Volley Zone!');
        return;
      }

      const isSmash = this.ball.z > 30;
      const isAIHitter = id === 'player2' && this.isP2AI;
      this.ball.hit(
        id,
        player.velocityX,
        player.velocityY,
        isSmash,
        this.particles,
        this.court.dims,
        this.getSpeedMultiplier(),
        this.score.difficulty,
        isAIHitter
      );

      this.score.rally++;
      this.notify();
    }
  }

  private awardFault(rallyWinner: PlayerId | null, reason: string) {
    if (!rallyWinner || this.state !== 'playing') return;

    this.score.pointWinner = rallyWinner;
    this.score.pointReason = reason;
    this.state = 'point';
    this.pointCooldownTimer = 85;

    const isServerWinner = rallyWinner === this.score.server;

    if (this.score.scoringMode === 'side-out') {
      if (isServerWinner) {
        if (rallyWinner === 'player1') {
          this.score.player1++;
        } else {
          this.score.player2++;
        }
        this.score.isSideOut = false;
        sound.playPointScored();
      } else {
        this.score.server = rallyWinner;
        this.score.isSideOut = true;
        this.score.pointReason += ' (SIDE OUT!)';
        sound.playNetHit();
      }
    } else {
      if (rallyWinner === 'player1') {
        this.score.player1++;
      } else {
        this.score.player2++;
      }
      this.score.server = rallyWinner;
      sound.playPointScored();
    }

    if (this.score.player1 >= 11 || this.score.player2 >= 11) {
      this.score.winner = this.score.player1 >= 11 ? 'player1' : 'player2';
      this.state = 'gameOver';
      sound.playVictory();
      this.particles.emitConfetti(this.court.dims.width, this.court.dims.height);
    }

    this.notify();
  }

  private nextPoint() {
    this.score.rally = 0;
    this.score.pointWinner = null;
    this.score.pointReason = '';
    this.score.isSideOut = false;
    this.p1HitStatus = 'idle';

    this.startServeCountdown();
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Full Overhead Court & Net
    this.court.render(ctx);

    // Subtle mouse/touch cursor target on court
    if (this.input.isMouseActive && (this.state === 'playing' || this.state === 'point')) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.input.mouseX, this.input.mouseY, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.input.mouseX, this.input.mouseY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.fill();
      ctx.restore();
    }

    // 2. Hit Indicator & Players (Top-Down)
    if (this.state === 'playing') {
      this.player1.renderHitIndicator(ctx, this.p1HitStatus, this.hitReach);
    }
    this.player1.render(ctx);
    this.player2.render(ctx);

    // 3. 3D Ball & Drop Shadow
    this.ball.render(ctx);

    // 4. Ground Particles & Confetti
    this.particles.render(ctx);

    // 5. Pre-Serve Countdown Timer Overlay on Canvas
    if (this.score.serveCountdown !== null && this.state === 'playing') {
      ctx.save();
      const count = this.score.serveCountdown;
      const centerX = this.court.dims.width / 2;
      const centerY = this.court.dims.height / 2;

      // Glow behind number
      ctx.font = '900 96px Outfit, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(190, 242, 100, 0.85)';
      ctx.shadowBlur = 35;
      ctx.fillStyle = '#bef264';
      ctx.fillText(count.toString(), centerX, centerY - 20);

      ctx.shadowBlur = 0;
      ctx.font = '700 16px Outfit, system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      const serverText = this.score.server === 'player1' ? 'PLAYER 1' : 'PLAYER 2';
      ctx.fillText(`${serverText} SERVING...`, centerX, centerY + 45);

      ctx.font = '600 12px Outfit, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText('TAP OR CLICK TO SERVE NOW', centerX, centerY + 70);
      ctx.restore();
    }
  }
}
