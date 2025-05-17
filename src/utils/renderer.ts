// Previous imports remain the same...

// Add new fence colors
const fenceColors = {
  [FenceType.Wooden]: '#8B4513',
  [FenceType.Floral]: '#FF69B4',
  [FenceType.Crystal]: '#87CEEB',
  [FenceType.Rainbow]: '#FF1493'
};

export function renderTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  offsetX: number,
  offsetY: number
) {
  const { isoX, isoY } = cartesianToIsometric(tile.x, tile.y);
  const x = offsetX + isoX;
  const y = offsetY + isoY;

  // Draw base tile
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();

  ctx.fillStyle = biomeColors[tile.type] || biomeColors['grass'];
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Draw fence if present
  if (tile.hasFence && tile.fenceType) {
    drawFence(ctx, x, y, tile.fenceType);
  }

  if (tile.decoration) {
    drawDecoration(ctx, tile, x, y);
  }
}

function drawFence(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fenceType: FenceType
) {
  const fenceHeight = 16;
  const postWidth = 4;
  const color = fenceColors[fenceType];

  // Draw main fence post
  ctx.fillStyle = color;
  ctx.fillRect(x - postWidth/2, y - fenceHeight, postWidth, fenceHeight);

  // Draw horizontal bars
  ctx.fillRect(x - TILE_WIDTH/4, y - fenceHeight + 4, TILE_WIDTH/2, 3);
  ctx.fillRect(x - TILE_WIDTH/4, y - fenceHeight/2, TILE_WIDTH/2, 3);

  // Add decorative elements based on fence type
  switch(fenceType) {
    case FenceType.Floral:
      drawFloralDecorations(ctx, x, y - fenceHeight);
      break;
    case FenceType.Crystal:
      drawCrystalDecorations(ctx, x, y - fenceHeight);
      break;
    case FenceType.Rainbow:
      drawRainbowDecorations(ctx, x, y - fenceHeight);
      break;
  }
}

function drawFloralDecorations(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const flowerColors = ['#FF69B4', '#FFB6C1', '#FFC0CB'];
  
  // Draw small flowers
  flowerColors.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(x + (i-1) * 8, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function drawCrystalDecorations(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Draw crystal shapes
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 4, y + 6);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x - 4, y + 6);
  ctx.closePath();
  ctx.fillStyle = '#B0E0E6';
  ctx.fill();
}

function drawRainbowDecorations(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];
  
  // Draw rainbow pattern
  colors.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(x, y + 4, 8 - i, 0, Math.PI, true);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// Rest of the renderer.ts file remains unchanged...