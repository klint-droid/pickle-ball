import type { GameState, GameScore, PlayerId, CourtSide, ScoringMode } from '../types/game';
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
    scoringMode: 'side-out', // Official pickleball default
    isSideOut: false,
    pointWinner: null,
    pointReason: '',
    winner: null
  };

  private pointCooldownTimer: number = 0;
  private onStateChange: ((state: GameState, score: GameScore) => void) | null = null;
  private hitReach: number = 48;

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
    // In pickleball: even score = Right/Even court, odd score = Left/Odd court
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
      winner: null
    };

    this.particles.clear();
    const courtSide = this.computeServerCourt();
    this.score.serverCourt = courtSide;

    this.player1.resetPosition(this.court.dims, true, courtSide);
    this.player2.resetPosition(this.court.dims, false, courtSide);
    this.ball.resetToServe('player1', courtSide, this.court.dims);

    this.state = 'playing';
    this.input.start();
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

    // Active Match Updates
    const p1Input = this.input.getPlayer1Input();
    const p2Input = this.input.getPlayer2Input();

    // 1. Update Player 1 with Mouse Hover Movement
    this.player1.updateWithMouse(this.input.mouseX, this.input.mouseY, p1Input.justHit, this.ball.x, this.ball.y);

    // Auto-hit if mouse paddle collides directly with ball, or on click/space
    const p1Paddle = this.player1.getPaddleHitCenter();
    const p1Dist = Math.hypot(this.ball.x - p1Paddle.x, this.ball.y - p1Paddle.y);
    const isP1HoverContact = p1Dist <= 32 && this.ball.z < 65 && this.ball.currentSide === 'left';
    const p1ShouldHit = p1Input.justHit || isP1HoverContact;
    this.checkPlayerHit('player1', this.player1, p1ShouldHit);

    // 2. Update Player 2: Human Keyboard or Smart Pickleball AI
    const isP2Human = p2Input.left || p2Input.right || p2Input.up || p2Input.down || p2Input.justHit;
    if (isP2Human) {
      this.player2.updateWithKeyboard(p2Input, this.ball.x, this.ball.y);
      this.checkPlayerHit('player2', this.player2, p2Input.justHit);
    } else {
      const aiSwung = this.player2.updateAI(
        this.ball.x,
        this.ball.y,
        this.ball.z,
        this.ball.vx,
        this.ball.hasBouncedSinceHit,
        this.ball.shotCountInRally,
        this.court.dims
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

    // Paddle sweet-spot distance on the court ground plane
    const hitCenter = player.getPaddleHitCenter();
    const dist2D = Math.hypot(this.ball.x - hitCenter.x, this.ball.y - hitCenter.y);

    // Ball must be within paddle reach and below reach height (< 75px in 3D)
    if (dist2D <= this.hitReach && this.ball.z < 75) {
      // RULE 1: TWO-BOUNCE RULE
      // On Shot 0 (serve): receiver must let ball bounce before returning
      // On Shot 1 (return of serve): server must let ball bounce before hitting
      const isVolley = !this.ball.hasBouncedSinceHit;

      if (isVolley) {
        if (this.ball.shotCountInRally === 0) {
          // Receiver attempted to volley the serve!
          const opponent: PlayerId = id === 'player1' ? 'player2' : 'player1';
          this.awardFault(opponent, 'Two-Bounce Fault: Receiver must let serve bounce!');
          return;
        }

        if (this.ball.shotCountInRally === 1) {
          // Server attempted to volley the return of serve!
          const opponent: PlayerId = id === 'player1' ? 'player2' : 'player1';
          this.awardFault(opponent, 'Two-Bounce Fault: Server must let return bounce!');
          return;
        }
      }

      // RULE 2: NON-VOLLEY ZONE (KITCHEN) RULE
      // Players cannot volley the ball (hit before bounce) while standing in or touching the Kitchen
      if (isVolley && player.isInKitchen(this.court.dims)) {
        const opponent: PlayerId = id === 'player1' ? 'player2' : 'player1';
        this.awardFault(opponent, 'Kitchen Fault: Volleyed inside Non-Volley Zone!');
        return;
      }

      // Valid Hit Executed!
      const isSmash = this.ball.z > 30; // Overhead smash if ball is high
      this.ball.hit(
        id,
        player.velocityX,
        player.velocityY,
        isSmash,
        this.particles,
        this.court.dims
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
    this.pointCooldownTimer = 85; // ~1.4 seconds delay

    const isServerWinner = rallyWinner === this.score.server;

    if (this.score.scoringMode === 'side-out') {
      // OFFICIAL PICKLEBALL SIDE-OUT SCORING
      if (isServerWinner) {
        // Server won rally -> +1 point, retains serve
        if (rallyWinner === 'player1') {
          this.score.player1++;
        } else {
          this.score.player2++;
        }
        this.score.isSideOut = false;
        sound.playPointScored();
      } else {
        // Receiver won rally -> SIDE OUT! No points, serve passes to receiver
        this.score.server = rallyWinner;
        this.score.isSideOut = true;
        this.score.pointReason += ' (SIDE OUT!)';
        sound.playNetHit();
      }
    } else {
      // RALLY SCORING OPTION
      if (rallyWinner === 'player1') {
        this.score.player1++;
      } else {
        this.score.player2++;
      }
      this.score.server = rallyWinner;
      sound.playPointScored();
    }

    // Check Win Condition: First to 11 points (must win by 1 in MVP)
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

    // Determine court side (even/odd) for next serve
    const courtSide = this.computeServerCourt();
    this.score.serverCourt = courtSide;

    const isP1Server = this.score.server === 'player1';
    this.player1.resetPosition(this.court.dims, isP1Server, courtSide);
    this.player2.resetPosition(this.court.dims, !isP1Server, courtSide);
    this.ball.resetToServe(this.score.server, courtSide, this.court.dims);

    this.state = 'playing';
    this.notify();
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Full Overhead Court & Net
    this.court.render(ctx);

    // Subtle mouse cursor target on court
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

    // 2. Players (Top-Down)
    this.player1.render(ctx);
    this.player2.render(ctx);

    // 3. 3D Ball & Drop Shadow
    this.ball.render(ctx);

    // 4. Ground Particles & Confetti
    this.particles.render(ctx);
  }
}
