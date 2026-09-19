// Input management for Mouse Hover and Keyboard controls

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  hit: boolean;
  justHit: boolean;
}

export class InputManager {
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private isListening: boolean = false;
  private onEscapeCallback: (() => void) | null = null;

  // Mouse hover tracking (in 1280x720 canvas coordinates)
  public mouseX: number = 240;
  public mouseY: number = 360;
  public isMouseActive: boolean = false;
  public isMouseDown: boolean = false;
  public mouseJustClicked: boolean = false;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  public setOnEscape(cb: () => void) {
    this.onEscapeCallback = cb;
  }

  public setMousePosition(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
    this.isMouseActive = true;
  }

  public setMouseDown(down: boolean) {
    if (down && !this.isMouseDown) {
      this.mouseJustClicked = true;
    }
    this.isMouseDown = down;
  }

  public start() {
    if (this.isListening) return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.isListening = true;
  }

  public stop() {
    if (!this.isListening) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keysDown.clear();
    this.keysJustPressed.clear();
    this.isListening = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    const gameKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
    if (gameKeys.includes(e.code) || gameKeys.includes(e.key)) {
      e.preventDefault();
    }

    if (e.code === 'Escape') {
      if (this.onEscapeCallback) {
        this.onEscapeCallback();
      }
      return;
    }

    const code = e.code;
    if (!this.keysDown.has(code)) {
      this.keysJustPressed.add(code);
    }
    this.keysDown.add(code);
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keysDown.delete(e.code);
  }

  public getPlayer1Input(): PlayerInput {
    // Keyboard fallback or Space hit
    const up = this.keysDown.has('KeyW');
    const down = this.keysDown.has('KeyS');
    const left = this.keysDown.has('KeyA');
    const right = this.keysDown.has('KeyD');
    const hit = this.keysDown.has('Space') || this.isMouseDown;
    const justHit = this.keysJustPressed.has('Space') || this.mouseJustClicked;

    return { up, down, left, right, hit, justHit };
  }

  public getPlayer2Input(): PlayerInput {
    // Player 2: Arrows move, Enter hit
    const up = this.keysDown.has('ArrowUp');
    const down = this.keysDown.has('ArrowDown');
    const left = this.keysDown.has('ArrowLeft');
    const right = this.keysDown.has('ArrowRight');
    const hit = this.keysDown.has('Enter') || this.keysDown.has('NumpadEnter');
    const justHit = this.keysJustPressed.has('Enter') || this.keysJustPressed.has('NumpadEnter');

    return { up, down, left, right, hit, justHit };
  }

  public endFrame() {
    this.keysJustPressed.clear();
    this.mouseJustClicked = false;
  }
}
