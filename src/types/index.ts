export interface Point {
  x: number;
  y: number;
}

export interface IsometricPoint {
  isoX: number;
  isoY: number;
}

export interface Tile {
  id: string;
  type: BiomeType;
  x: number;
  y: number;
  height: number;
  decoration?: Decoration;
}

export interface CreaturePixel {
  x: number;
  y: number;
  color: string;
}

export interface Creature {
  id: string;
  type: CreatureType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  frame: number;
  direction: Direction;
  state: CreatureState;
  color: string;
  lastInteraction: number;
  evolutionStage: EvolutionStage;
  tools: Tool[];
  greetingType: 'none' | 'salutx1' | 'salutx2';
  pattern: CreaturePattern;
  pixels?: CreaturePixel[];
  width: number;
  height: number;
  interactions?: CreatureInteraction[];
  happiness: number;
}

export enum Direction {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
}

export enum CreatureState {
  Idle,
  Walking,
  Grouping,
  Separating,
}

export enum BiomeType {
  Forest,
  Desert,
  Mountain,
  River,
  Clearing,
  Edge,
}

export enum CreatureType {
  Rainbow,
  Orange,
  Blue,
}

export enum EvolutionStage {
  Basic,
  Standard,
  Advanced,
  SuperAdvanced,
}

export interface Tool {
  type: ToolType;
  level: number;
}

export enum ToolType {
  None,
  BasicTool,
  AdvancedTool,
  HighTechTool,
}

export interface Decoration {
  type: DecorationType;
  variant: number;
  evolutionStage: EvolutionStage;
}

export enum DecorationType {
  Ruins,
  LightSource,
  Totem,
  Tree,
  Rock,
  Flower,
  Settlement,
  Laboratory,
  SpacePort,
}

export interface WorldState {
  tiles: Tile[];
  creatures: Creature[];
  evolutionLevel: number;
  connections: number;
  fountains: Array<{ x: number; y: number }>;
  pinkTrees: Array<{ x: number; y: number }>;
}

export interface GameContextType {
  world: WorldState;
  selectedCreature: Creature | null;
  setSelectedCreature: (creature: Creature | null) => void;
  handleTileClick: (x: number, y: number) => void;
}

export interface Fountain {
  x: number;
  y: number;
  state: 1 | 2 | 3 | 4; // 1: normal, 2: plus d'eau, 3: encore plus d'eau, 4: débordement
}

export type CreaturePattern = 'default' | 'striped' | 'rainbow';

export type FoodType = 'apple' | 'yellowflower' | 'pinkflower' | 'rainbowflower';

export interface Food {
  type: FoodType;
  name: string;
  image: string;
  effect: {
    color?: string;
    pattern?: CreaturePattern;
    evolution?: number;
    happiness: number;
  };
}

export interface CreatureInteraction {
  type: 'feed';
  food: FoodType;
  timestamp: number;
}