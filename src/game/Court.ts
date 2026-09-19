import type { CourtDimensions } from '../types/game';

export class Court {
  public dims: CourtDimensions;

  constructor(virtualWidth: number = 1280, virtualHeight: number = 720) {
    // Official 44ft x 20ft pickleball court aspect ratio (2.2 : 1)
    const courtWidth = 924;
    const courtHeight = 420;

    const courtLeft = (virtualWidth - courtWidth) / 2;
    const courtRight = courtLeft + courtWidth;
    const courtTop = (virtualHeight - courtHeight) / 2;
    const courtBottom = courtTop + courtHeight;

    const netX = virtualWidth / 2;
    const netHeight = 36; // 3D units for net height
    // 7ft on each side = 147px out of 924px
    const kitchenWidth = Math.round((7 / 44) * courtWidth);
    const kitchenLeft = netX - kitchenWidth;
    const kitchenRight = netX + kitchenWidth;
    const centerlineY = virtualHeight / 2;

    this.dims = {
      width: virtualWidth,
      height: virtualHeight,
      courtLeft,
      courtRight,
      courtTop,
      courtBottom,
      courtWidth,
      courtHeight,
      netX,
      netHeight,
      kitchenLeft,
      kitchenRight,
      kitchenWidth,
      centerlineY
    };
  }

  public isPointInBounds(x: number, y: number): boolean {
    const { courtLeft, courtRight, courtTop, courtBottom } = this.dims;
    return x >= courtLeft && x <= courtRight && y >= courtTop && y <= courtBottom;
  }

  public isPointInKitchen(x: number, y: number): boolean {
    const { kitchenLeft, kitchenRight, courtTop, courtBottom } = this.dims;
    return x >= kitchenLeft && x <= kitchenRight && y >= courtTop && y <= courtBottom;
  }

  public render(ctx: CanvasRenderingContext2D) {
    const {
      width,
      height,
      courtLeft,
      courtRight,
      courtTop,
      courtBottom,
      courtWidth,
      courtHeight,
      netX,
      kitchenLeft,
      kitchenRight,
      centerlineY
    } = this.dims;

    // 1. Stadium Surroundings / Arena Floor
    const stadiumGrad = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 750);
    stadiumGrad.addColorStop(0, '#0f172a');
    stadiumGrad.addColorStop(0.7, '#090d16');
    stadiumGrad.addColorStop(1, '#030712');
    ctx.fillStyle = stadiumGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle arena light cones from four corners
    const corners = [
      { x: 60, y: 40 },
      { x: width - 60, y: 40 },
      { x: 60, y: height - 40 },
      { x: width - 60, y: height - 40 }
    ];
    for (const c of corners) {
      const grad = ctx.createRadialGradient(c.x, c.y, 20, c.x, c.y, 350);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Court Run-Off Apron (Tournament Royal Blue Out-of-bounds area)
    const apronPaddingX = 90;
    const apronPaddingY = 55;
    const apronGrad = ctx.createLinearGradient(0, courtTop - apronPaddingY, 0, courtBottom + apronPaddingY);
    apronGrad.addColorStop(0, '#1e3a8a');
    apronGrad.addColorStop(0.5, '#1d4ed8');
    apronGrad.addColorStop(1, '#1e3a8a');

    ctx.fillStyle = apronGrad;
    ctx.beginPath();
    ctx.roundRect(
      courtLeft - apronPaddingX,
      courtTop - apronPaddingY,
      courtWidth + apronPaddingX * 2,
      courtHeight + apronPaddingY * 2,
      16
    );
    ctx.fill();

    // Subtle drop shadow around court perimeter
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Playing Surface (Tournament Emerald Green)
    const courtGrad = ctx.createLinearGradient(courtLeft, 0, courtRight, 0);
    courtGrad.addColorStop(0, '#047857');
    courtGrad.addColorStop(0.5, '#059669');
    courtGrad.addColorStop(1, '#047857');
    ctx.fillStyle = courtGrad;
    ctx.fillRect(courtLeft, courtTop, courtWidth, courtHeight);

    // 4. Non-Volley Zone (The Kitchen - Ocean Cyan)
    const kitchenGrad = ctx.createLinearGradient(kitchenLeft, 0, kitchenRight, 0);
    kitchenGrad.addColorStop(0, '#0f766e');
    kitchenGrad.addColorStop(0.5, '#0d9488');
    kitchenGrad.addColorStop(1, '#0f766e');
    ctx.fillStyle = kitchenGrad;
    ctx.fillRect(kitchenLeft, courtTop, kitchenRight - kitchenLeft, courtHeight);

    // Kitchen text watermark
    ctx.save();
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NON-VOLLEY ZONE', (kitchenLeft + netX) / 2, courtTop + 35);
    ctx.fillText('(KITCHEN)', (kitchenLeft + netX) / 2, courtTop + 55);
    ctx.fillText('NON-VOLLEY ZONE', (netX + kitchenRight) / 2, courtTop + 35);
    ctx.fillText('(KITCHEN)', (netX + kitchenRight) / 2, courtTop + 55);
    ctx.fillText('NO VOLLEYS', (kitchenLeft + netX) / 2, courtBottom - 35);
    ctx.fillText('NO VOLLEYS', (netX + kitchenRight) / 2, courtBottom - 35);
    ctx.restore();

    // Service Court Watermark Labels
    ctx.save();
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Player 1 (Left side)
    ctx.fillText('LEFT / ODD COURT', (courtLeft + kitchenLeft) / 2, (courtTop + centerlineY) / 2);
    ctx.fillText('RIGHT / EVEN COURT', (courtLeft + kitchenLeft) / 2, (centerlineY + courtBottom) / 2);
    // Player 2 (Right side)
    ctx.fillText('RIGHT / EVEN COURT', (kitchenRight + courtRight) / 2, (courtTop + centerlineY) / 2);
    ctx.fillText('LEFT / ODD COURT', (kitchenRight + courtRight) / 2, (centerlineY + courtBottom) / 2);
    ctx.restore();

    // 5. Crisp White Court Markings (Sidelines, Baselines, Kitchen Lines, Centerlines)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'square';

    // Outer Court Boundary (Baselines and Sidelines)
    ctx.strokeRect(courtLeft, courtTop, courtWidth, courtHeight);

    // Kitchen Lines (Non-Volley Zone boundaries 7ft from net)
    ctx.beginPath();
    ctx.moveTo(kitchenLeft, courtTop);
    ctx.lineTo(kitchenLeft, courtBottom);
    ctx.moveTo(kitchenRight, courtTop);
    ctx.lineTo(kitchenRight, courtBottom);
    ctx.stroke();

    // Centerlines: divide backcourts into Left & Right Service Boxes
    ctx.beginPath();
    // P1 side centerline
    ctx.moveTo(courtLeft, centerlineY);
    ctx.lineTo(kitchenLeft, centerlineY);
    // P2 side centerline
    ctx.moveTo(kitchenRight, centerlineY);
    ctx.lineTo(courtRight, centerlineY);
    ctx.stroke();

    // 6. Center Net (Top-Down Representation)
    this.renderNet(ctx);
  }

  private renderNet(ctx: CanvasRenderingContext2D) {
    const { netX, courtTop, courtBottom } = this.dims;
    const netYStart = courtTop - 18;
    const netYEnd = courtBottom + 18;

    // Net drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(netX + 2, netYStart, 5, netYEnd - netYStart);

    // Dark net mesh band
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(netX - 2.5, netYStart, 5, netYEnd - netYStart);

    // White Top Net Tape / Cord
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(netX - 1.5, netYStart, 3, netYEnd - netYStart);

    // Steel Net Posts on Sidelines
    const postRadius = 6;
    ctx.fillStyle = '#334155';
    // Top Post
    ctx.beginPath();
    ctx.arc(netX, netYStart, postRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bottom Post
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(netX, netYEnd, postRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
