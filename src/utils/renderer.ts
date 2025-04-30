import { Creature, Tile, BiomeType, EvolutionStage } from '../types';
import { cartesianToIsometric } from './isometric';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

const biomeColors = {
  [BiomeType.Forest]: '#70e1c8',
  [BiomeType.Desert]: '#f6d58e',
  [BiomeType.Mountain]: '#9c88c1',
  [BiomeType.River]: '#58c1dd',
  [BiomeType.Clearing]: '#b8e3a8',
  [BiomeType.Edge]: '#a68f7c',
};

const decorationColors = {
  ruins: '#c1b49c',
  lightSource: '#ffda7a',
  totem: '#c15f33',
  tree: '#2b8571',
  rock: '#7c7c7c',
  flower: '#fc97e3',
  settlement: '#e6d5ac',
  laboratory: '#a4d4e6',
  spacePort: '#8f71ff',
};

export function renderTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  offsetX: number,
  offsetY: number
) {
  const { isoX, isoY } = cartesianToIsometric(tile.x, tile.y);
  const x = offsetX + isoX;
  const y = offsetY + isoY - tile.height * 4;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();

  ctx.fillStyle = biomeColors[tile.type];
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  if (tile.height > 0) {
    ctx.beginPath();
    ctx.moveTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2 + tile.height * 4);
    ctx.lineTo(x, y + TILE_HEIGHT + tile.height * 4);
    ctx.closePath();
    
    ctx.fillStyle = adjustColor(biomeColors[tile.type], -30);
    ctx.fill();
  }

  if (tile.decoration) {
    drawDecoration(ctx, tile, x, y);
  }
}

export function renderCreature(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  offsetX: number,
  offsetY: number,
  isSelected: boolean,
  earAnimation: number = 0,
  isWalletConnected: boolean = false
) {
  const { isoX, isoY } = cartesianToIsometric(creature.x, creature.y);
  const x = offsetX + isoX;
  const y = offsetY + isoY;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x, y + 12, 15, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();

  const bobAmount = creature.state === 1 ? Math.sin(creature.frame * Math.PI * 2) * 2 : 0;

  // Draw body with direction
  drawPixelatedBody(ctx, x, y - 20 + bobAmount, creature.color, 32, 32, creature.direction);
  
  // Draw ears with direction and animation
  drawPixelatedEars(ctx, x, y - 35 + bobAmount, creature.color, creature.direction, earAnimation, isWalletConnected);

  // Draw eyes based on direction
  if (creature.direction !== 0) { // Don't draw eyes when facing back
    drawPixelatedEyes(ctx, x, y - 25 + bobAmount, creature.direction);
  }

  // Draw legs with animation
  drawPixelatedLegs(ctx, x, y - 10 + bobAmount, creature.state === 1 ? creature.frame : 0, creature.direction);

  // Selection indicator
  if (isSelected) {
    ctx.beginPath();
    ctx.ellipse(x, y, 25, 15, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawPixelatedBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  width: number,
  height: number,
  direction: number
) {
  const pixelSize = 4;
  ctx.fillStyle = color;
  
  // Body shape based on direction
  const bodyShape = getBodyShape(direction);
  
  bodyShape.forEach((row, i) => {
    row.forEach((pixel, j) => {
      if (pixel) {
        ctx.fillRect(
          x - width/2 + j * pixelSize,
          y + i * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    });
  });
}

function getBodyShape(direction: number): number[][] {
  // 0: North (back view)
  // 2: East (right view)
  // 4: South (front view)
  // 6: West (left view)
  
  const shapes = {
    // Front view (default)
    4: [
      [0,1,1,1,1,0],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [0,1,1,1,1,0]
    ],
    // Back view
    0: [
      [0,1,1,1,1,0],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [0,1,1,1,1,0]
    ],
    // Side view (left)
    6: [
      [0,0,1,1,0,0],
      [0,1,1,1,1,0],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [0,1,1,1,1,0],
      [0,0,1,1,0,0]
    ],
    // Side view (right)
    2: [
      [0,0,1,1,0,0],
      [0,1,1,1,1,0],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [0,1,1,1,1,0],
      [0,0,1,1,0,0]
    ]
  };
  
  return shapes[direction] || shapes[4];
}

function drawPixelatedEars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  direction: number,
  earAnimation: number = 0,
  isWalletConnected: boolean = false
) {
  const pixelSize = 4;
  ctx.fillStyle = color;
  
  // Ear shapes based on direction
  const earShapes = {
    // Front view
    4: {
      left: [
        [0,0,1,1],
        [0,1,1,1],
        [1,1,1,0],
        [1,1,0,0]
      ],
      right: [
        [1,1,0,0],
        [1,1,1,0],
        [0,1,1,1],
        [0,0,1,1]
      ]
    },
    // Back view
    0: {
      left: [
        [1,1,0,0],
        [1,1,1,0],
        [0,1,1,1],
        [0,0,1,1]
      ],
      right: [
        [0,0,1,1],
        [0,1,1,1],
        [1,1,1,0],
        [1,1,0,0]
      ]
    },
    // Side view (left)
    6: {
      left: [
        [0,1,1,0],
        [1,1,1,0],
        [1,1,0,0],
        [0,0,0,0]
      ],
      right: [
        [0,1,1,0],
        [0,1,1,1],
        [0,0,1,1],
        [0,0,0,0]
      ]
    },
    // Side view (right)
    2: {
      left: [
        [0,1,1,0],
        [0,1,1,1],
        [0,0,1,1],
        [0,0,0,0]
      ],
      right: [
        [0,1,1,0],
        [1,1,1,0],
        [1,1,0,0],
        [0,0,0,0]
      ]
    },
    // Special tall ears for wallet connection
    tall: {
      left: [
        [0,1],
        [1,1],
        [1,1],
        [1,1],
        [1,1]
      ],
      right: [
        [1,1],
        [1,1],
        [1,1],
        [1,1],
        [0,1]
      ]
    }
  };
  
  // Utiliser les oreilles spéciales si wallet connecté
  const ears = isWalletConnected ? earShapes.tall : (earShapes[direction as keyof typeof earShapes] || earShapes[4]);
  const earOffset = Math.sin(earAnimation) * 2;

  if (isWalletConnected) {
    // Oreilles spéciales : centrées au-dessus des yeux
    // Position horizontale centrée, verticale plus haute
    ears.left.forEach((row, i) => {
      row.forEach((pixel, j) => {
        if (pixel) {
          ctx.fillRect(
            x - 18 + j * pixelSize,
            y - 10 + i * pixelSize + earOffset - 4,
            pixelSize,
            pixelSize
          );
        }
      });
    });
    ears.right.forEach((row, i) => {
      row.forEach((pixel, j) => {
        if (pixel) {
          ctx.fillRect(
            x + 9 + j * pixelSize,
            y - 10 + i * pixelSize + earOffset - 4,
            pixelSize,
            pixelSize
          );
        }
      });
    });
  } else {
    // Oreilles classiques : légèrement plus hautes
    ears.left.forEach((row, i) => {
      row.forEach((pixel, j) => {
        if (pixel) {
          ctx.fillRect(
            x - 20 + j * pixelSize,
            y + i * pixelSize + earOffset - 4,
            pixelSize,
            pixelSize
          );
        }
      });
    });
    ears.right.forEach((row, i) => {
      row.forEach((pixel, j) => {
        if (pixel) {
          ctx.fillRect(
            x + 4 + j * pixelSize,
            y + i * pixelSize + earOffset - 4,
            pixelSize,
            pixelSize
          );
        }
      });
    });
  }
}

function drawPixelatedEyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: number
) {
  const pixelSize = 4;
  
  // White of eyes
  ctx.fillStyle = 'white';
  ctx.fillRect(x - 10, y, pixelSize * 2, pixelSize * 2);
  ctx.fillRect(x + 2, y, pixelSize * 2, pixelSize * 2);
  
  // Pupils
  ctx.fillStyle = 'black';
  
  // Adjust pupil position based on direction
  const pupilOffset = direction === 2 ? 1 : direction === 6 ? -1 : 0;
  
  ctx.fillRect(x - 8 + pupilOffset * pixelSize, y + 2, pixelSize, pixelSize);
  ctx.fillRect(x + 4 + pupilOffset * pixelSize, y + 2, pixelSize, pixelSize);
}

function drawPixelatedLegs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  direction: number
) {
  const pixelSize = 4;
  ctx.fillStyle = '#000000';
  
  const legSpacing = 10;
  const legOffset = Math.sin(frame * Math.PI * 2) * 4;
  
  // Front legs
  ctx.fillRect(x - legSpacing, y + legOffset, pixelSize, pixelSize * 3);
  ctx.fillRect(x + legSpacing - pixelSize, y - legOffset, pixelSize, pixelSize * 3);
  
  // Back legs
  ctx.fillRect(x - legSpacing, y - legOffset, pixelSize, pixelSize * 3);
  ctx.fillRect(x + legSpacing - pixelSize, y + legOffset, pixelSize, pixelSize * 3);
}

function drawTools(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  creature: Creature
) {
  const pixelSize = 4;
  
  creature.tools.forEach((tool, index) => {
    const toolColor = getToolColor(tool.type);
    ctx.fillStyle = toolColor;
    
    // Draw tool with appropriate style based on evolution stage
    const offsetX = (index - creature.tools.length/2) * 15;
    
    // Simple pixel art tool representation
    ctx.fillRect(x + offsetX, y, pixelSize * 2, pixelSize * 4);
  });
}

function getToolColor(toolType: number): string {
  switch (toolType) {
    case 1: return '#8B4513'; // Basic tools (wood)
    case 2: return '#808080'; // Advanced tools (metal)
    case 3: return '#4169E1'; // High-tech tools
    default: return '#000000';
  }
}

function isPartOfBodyShape(x: number, y: number): boolean {
  // Define the circular body shape in a pixel grid
  const centerX = 4;
  const centerY = 4;
  const radius = 4;
  
  const distance = Math.sqrt(
    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
  );
  
  return distance <= radius;
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawDecoration(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  x: number,
  y: number
) {
  if (!tile.decoration) return;

  const decoration = tile.decoration;
  const evolutionScale = (decoration.evolutionStage + 1) * 0.25;

  switch (decoration.type) {
    case 0: // Ruins
      drawRuins(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 1: // Light source
      drawLightSource(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 2: // Totem
      drawTotem(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 3: // Tree
      drawTree(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 4: // Rock
      drawRock(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 5: // Flower
      drawFlower(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 6: // Settlement
      drawSettlement(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 7: // Laboratory
      drawLaboratory(ctx, x, y, decoration.variant, evolutionScale);
      break;
    case 8: // Space Port
      drawSpacePort(ctx, x, y, decoration.variant, evolutionScale);
      break;
  }
}

function drawRuins(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  ctx.fillStyle = decorationColors.ruins;
  ctx.fillRect(x - 5, y - 10, 10, 10);
  
  if (variant % 2 === 0) {
    ctx.fillRect(x + 5, y - 8, 6, 8);
  }
}

function drawLightSource(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  // Glow effect
  const gradient = ctx.createRadialGradient(x, y - 5, 0, x, y - 5, 15);
  gradient.addColorStop(0, 'rgba(255, 218, 122, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 218, 122, 0)');
  
  ctx.beginPath();
  ctx.arc(x, y - 5, 15, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Center
  ctx.beginPath();
  ctx.arc(x, y - 5, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
}

function drawTotem(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  ctx.fillStyle = decorationColors.totem;
  ctx.fillRect(x - 3, y - 20, 6, 20);
  
  // Totem face
  ctx.fillStyle = variant % 2 === 0 ? '#8d452b' : '#af5633';
  ctx.fillRect(x - 5, y - 18, 10, 6);
  
  // Eyes
  ctx.fillStyle = 'white';
  ctx.fillRect(x - 3, y - 17, 2, 2);
  ctx.fillRect(x + 1, y - 17, 2, 2);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  // Trunk
  ctx.fillStyle = '#7d5a44';
  ctx.fillRect(x - 2, y - 10, 4, 10);
  
  // Foliage
  ctx.beginPath();
  ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
  ctx.fillStyle = decorationColors.tree;
  ctx.fill();
  
  if (variant % 3 === 0) {
    ctx.beginPath();
    ctx.arc(x - 4, y - 18, 5, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 18, 5, 0, Math.PI * 2);
    ctx.arc(x, y - 22, 5, 0, Math.PI * 2);
    ctx.fillStyle = decorationColors.tree;
    ctx.fill();
  }
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  ctx.beginPath();
  ctx.arc(x, y - 4, 5, 0, Math.PI * 2);
  ctx.fillStyle = decorationColors.rock;
  ctx.fill();
  
  if (variant % 2 === 0) {
    ctx.beginPath();
    ctx.arc(x - 3, y - 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = adjustColor(decorationColors.rock, 20);
    ctx.fill();
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  // Stem
  ctx.strokeStyle = '#58a058';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 8);
  ctx.stroke();
  
  // Flower
  const petalSize = 3;
  const colors = [decorationColors.flower, '#ffca80', '#a8e0ff', '#d8ffb0'];
  const color = colors[variant % colors.length];
  
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const px = x + Math.cos(angle) * petalSize;
    const py = (y - 8) + Math.sin(angle) * petalSize;
    
    ctx.beginPath();
    ctx.arc(px, py, petalSize, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  // Center
  ctx.beginPath();
  ctx.arc(x, y - 8, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffec33';
  ctx.fill();
}

function drawSettlement(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  variant: number,
  scale: number
) {
  ctx.fillStyle = decorationColors.settlement;
  const size = 15 * scale;
  
  // Base building
  ctx.fillRect(x - size/2, y - size, size, size);
  
  // Roof
  ctx.beginPath();
  ctx.moveTo(x - size/2, y - size);
  ctx.lineTo(x, y - size * 1.5);
  ctx.lineTo(x + size/2, y - size);
  ctx.closePath();
  ctx.fill();
}

function drawLaboratory(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  variant: number,
  scale: number
) {
  ctx.fillStyle = decorationColors.laboratory;
  const size = 20 * scale;
  
  // Main structure
  ctx.fillRect(x - size/2, y - size * 1.2, size, size);
  
  // Dome
  ctx.beginPath();
  ctx.arc(x, y - size * 1.2, size/2, Math.PI, 0);
  ctx.fill();
}

function drawSpacePort(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  variant: number,
  scale: number
) {
  ctx.fillStyle = decorationColors.spacePort;
  const size = 25 * scale;
  
  // Landing pad
  ctx.fillRect(x - size/2, y - size/4, size, size/4);
  
  // Control tower
  ctx.fillRect(x - size/6, y - size, size/3, size);
  
  // Antenna
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y - size * 1.3);
  ctx.stroke();
}