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
  ownerId?: string; // Wallet address of the tile owner
  hasFence?: boolean; // New property for fences
  fenceType?: FenceType; // Type of fence if present
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
  vitality: number;
  ownerId: string;
  emotionalState: EmotionalState;
  lastFed: number;
  isPlaying: boolean;
  playingWith?: string;
}

export enum FenceType {
  Wooden = 'wooden',
  Floral = 'floral',
  Crystal = 'crystal',
  Rainbow = 'rainbow'
}

export enum EmotionalState {
  Happy = 'happy',
  Sad = 'sad',
  Sick = 'sick'
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
  Playing,
  Bathing,
  Eating
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
  fountains: Array<{ x: number; y: number; state: number }>;
  pinkTrees: Array<{ x: number; y: number }>;
  privateGardens: PrivateGarden[];
}

export interface PrivateGarden {
  ownerId: string;
  tiles: Point[];
  createdAt: number;
  fenceType?: FenceType;
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
  state: 1 | 2 | 3 | 4;
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
    vitality: number;
  };
}

export interface CreatureInteraction {
  type: 'feed' | 'play' | 'bathe';
  food?: FoodType;
  timestamp: number;
  withCreatureId?: string;
}

export interface GardenClaim {
  ownerId: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  fenceType?: FenceType;
}