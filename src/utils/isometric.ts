import { IsometricPoint, Point } from '../types';

// Constants for isometric conversion
const TILE_WIDTH = 64;  // Width of a tile in pixels
const TILE_HEIGHT = 32; // Height of a tile in pixels

// Convert cartesian coordinates to isometric coordinates
export function cartesianToIsometric(x: number, y: number): IsometricPoint {
  const isoX = (x - y) * (TILE_WIDTH / 2);
  const isoY = (x + y) * (TILE_HEIGHT / 2);
  return { isoX, isoY };
}

// Convert isometric coordinates to cartesian coordinates
export function isometricToCartesian(isoX: number, isoY: number): Point {
  const x = (isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2;
  const y = (isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2;
  return { x, y };
}

// Get the screen position of a tile or creature
export function getScreenPosition(
  x: number,
  y: number,
  offsetX: number,
  offsetY: number
): Point {
  const { isoX, isoY } = cartesianToIsometric(x, y);
  return {
    x: isoX + offsetX,
    y: isoY + offsetY,
  };
}