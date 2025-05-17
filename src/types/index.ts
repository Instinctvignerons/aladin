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
  vitality: number; // New vitality gauge (0-100)
  ownerId: string; // Wallet address of the owner
  emotionalState: EmotionalState; // Current emotional state
  lastFed: number; // Timestamp of last feeding
  isPlaying: boolean; // Whether the creature is currently playing
  playingWith?: string; // ID of creature it's playing with
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
  ownerId: string; // Wallet address
  tiles: Point[]; // Array of tile coordinates that belong to this garden
  createdAt: number;
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
    vitality: number; // Amount of vitality restored
  };
}

export interface CreatureInteraction {
  type: 'feed' | 'play' | 'bathe';
  food?: FoodType;
  timestamp: number;
  withCreatureId?: string; // For play interactions
}

export interface GardenClaim {
  ownerId: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
}