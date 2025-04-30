import { v4 as uuidv4 } from 'uuid';
import {
  BiomeType,
  CreatureState,
  CreatureType,
  DecorationType,
  Direction,
  Tile,
  WorldState,
  Creature,
} from '../types';

// Random color generator for creatures
const generateCreatureColor = (type: CreatureType): string => {
  switch (type) {
    case CreatureType.Rainbow:
      // Rainbow gradient creature
      return '#ff7eee';
    case CreatureType.Orange:
      // Orange creature with variations
      return '#ff9f43';
    case CreatureType.Blue:
      // Blue creature with variations
      return '#54a0ff';
    default:
      return '#ff9f43';
  }
};

// Generate a complete world
export function generateWorld(): WorldState {
  // Generate tiles in a circular island pattern
  const tiles: Tile[] = [];
  const size = 20; // Island radius augmenté de 30%
  const centerX = 0;
  const centerY = 0;

  // Create tiles in a roughly circular pattern
  for (let x = -size; x <= size; x++) {
    for (let y = -size; y <= size; y++) {
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      
      if (distanceFromCenter <= size) {
        // Determine tile height and biome based on position
        let height = 0;
        let biomeType = BiomeType.Clearing;
        
        // Slightly varied height for terrain elevation
        if (distanceFromCenter > size - 3) {
          height = 0;
          biomeType = BiomeType.Edge;
        } else if (distanceFromCenter > size - 6) {
          // Forest ring
          height = 1;
          biomeType = BiomeType.Forest;
        } else if (distanceFromCenter < 3) {
          // Central clearing
          height = 2;
          biomeType = BiomeType.Clearing;
        } else {
          // Mixed terrain
          height = 1 + Math.floor(Math.random() * 2);
          
          // Biome assignment with some noise
          const angle = Math.atan2(y, x) + Math.PI;
          const normalizedAngle = angle / (Math.PI * 2);
          
          if (normalizedAngle < 0.25) {
            biomeType = BiomeType.Forest;
          } else if (normalizedAngle < 0.5) {
            biomeType = BiomeType.Desert;
          } else if (normalizedAngle < 0.75) {
            biomeType = BiomeType.Mountain;
          } else {
            biomeType = BiomeType.River;
          }
          
          // Add some river veins
          if (Math.random() < 0.05) {
            biomeType = BiomeType.River;
            height = 0;
          }
        }
        
        // Add tile to array
        tiles.push({
          id: uuidv4(),
          type: biomeType,
          x: centerX + x,
          y: centerY + y,
          height,
          // Add decorations randomly
          decoration: Math.random() < 0.1 ? {
            type: Math.floor(Math.random() * 6) as DecorationType,
            variant: Math.floor(Math.random() * 4),
            evolutionStage: 0,
          } : undefined,
        });
      }
    }
  }

  // Generate some creatures
  const creatures: Creature[] = [];
  const creatureCount = 5; // Adjust as needed

  for (let i = 0; i < creatureCount; i++) {
    const creatureType = Math.floor(Math.random() * 3) as CreatureType;
    
    // Distribute creatures around the island, not too close to edge
    const angle = (i / creatureCount) * Math.PI * 2;
    const distance = Math.random() * (size / 2) + 2;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    creatures.push({
      id: uuidv4(),
      type: creatureType,
      x,
      y,
      targetX: x,
      targetY: y,
      frame: 0,
      direction: Math.floor(Math.random() * 8) as Direction,
      state: CreatureState.Idle,
      color: generateCreatureColor(creatureType),
      lastInteraction: Date.now(),
      evolutionStage: 0,
      tools: [],
    });
  }

  return { tiles, creatures, evolutionLevel: 0, connections: 0 };
}