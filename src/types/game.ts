export type GameState = 'menu' | 'playing' | 'point' | 'paused' | 'gameOver';

export type PlayerId = 'player1' | 'player2';

export type CourtSide = 'even' | 'odd'; // Even = right service box, Odd = left service box

export type ScoringMode = 'side-out' | 'rally';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Player {
  id: PlayerId;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  angle: number;
  isHitting: boolean;
  hitTimer: number;
  paddleAngle: number;
  bodyColor: string;
  shirtColor: string;
  paddleColor: string;
}

export interface BallTrailPoint {
  x: number;
  y: number;
  z: number;
  alpha: number;
  radius: number;
}

export interface BallLandingPrediction {
  x: number;
  y: number;
  framesRemaining: number;
  totalFlightFrames: number;
}

export interface Ball {
  x: number;
  y: number;
  z: number; // Height above court ground (z >= 0)
  radius: number;
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  rotation: number;
  lastHitBy: PlayerId | null;
  bounceCountOnSide: number;
  currentSide: 'left' | 'right' | null;
  hasBouncedSinceHit: boolean;
  isServe: boolean;
  shotCountInRally: number; // 0: serve, 1: return, 2: 3rd shot, 3+: open rally
  targetServiceBox?: { minX: number; maxX: number; minY: number; maxY: number } | null;
  predictedLanding?: BallLandingPrediction | null;
  trail: BallTrailPoint[];
  isActive: boolean;
}

export interface CourtDimensions {
  width: number;
  height: number;
  courtLeft: number;
  courtRight: number;
  courtTop: number;
  courtBottom: number;
  courtWidth: number;
  courtHeight: number;
  netX: number;
  netHeight: number; // In 3D units (e.g. 36px)
  kitchenLeft: number;
  kitchenRight: number;
  kitchenWidth: number;
  centerlineY: number;
}

export interface Particle {
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'rect' | 'spark' | 'ring';
  rotation?: number;
  vRot?: number;
}

export interface GameScore {
  player1: number;
  player2: number;
  rally: number;
  server: PlayerId;
  serverCourt: CourtSide;
  scoringMode: ScoringMode;
  difficulty: DifficultyLevel;
  isSideOut: boolean;
  pointWinner: PlayerId | null;
  pointReason: string;
  serveCountdown: number | null;
  winner: PlayerId | null;
}
