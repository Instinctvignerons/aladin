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
}

export interface GameContextType {
  world: WorldState;
  selectedCreature: Creature | null;
  setSelectedCreature: (creature: Creature | null) => void;
  handleTileClick: (x: number, y: number) => void;
}