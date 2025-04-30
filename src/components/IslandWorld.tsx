import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { cartesianToIsometric, isometricToCartesian } from '../utils/isometric';
import { renderTile, renderCreature } from '../utils/renderer';
import { Creature, Tile } from '../types';

export const IslandWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { world, selectedCreature, setSelectedCreature, handleTileClick, isWalletConnected } = useGame();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [earAnimation, setEarAnimation] = useState(0);
  const [showSpecialEars, setShowSpecialEars] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.3), 2));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel);
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Animation frame loop
  useEffect(() => {
    let animationFrame: number;
    let lastTime = 0;
    let walletConnectionTime = 0;

    const animate = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set the center offset to position the island in the middle
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Apply zoom
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX, -centerY);

      // Draw background (static stars)
      drawBackground(ctx, canvas.width, canvas.height);

      // Draw island shadow
      drawIslandShadow(ctx, centerX, centerY);

      // Sort tiles by their y position for correct rendering order
      const sortedTiles = [...world.tiles].sort((a, b) => {
        const aIso = cartesianToIsometric(a.x, a.y);
        const bIso = cartesianToIsometric(b.x, b.y);
        return aIso.isoY - bIso.isoY;
      });

      // Draw all tiles
      sortedTiles.forEach((tile) => {
        renderTile(ctx, tile, offset.x + centerX, offset.y + centerY);
      });

      // Update creature positions and behaviors
      const updatedCreatures = world.creatures.map((creature) => {
        // Move creature towards target
        const dx = creature.targetX - creature.x;
        const dy = creature.targetY - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.1) {
          const speed = 0.15; // Increased speed
          const newX = creature.x + (dx / distance) * speed * (deltaTime / 16);
          const newY = creature.y + (dy / distance) * speed * (deltaTime / 16);

          // Determine direction based on movement (8 directions)
          let direction = creature.direction;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const normalizedAngle = (angle + 360) % 360;
          
          // Convert angle to 8 directions
          if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) {
            direction = 2; // East
          } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
            direction = 1; // North-East
          } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
            direction = 0; // North
          } else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) {
            direction = 7; // North-West
          } else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) {
            direction = 6; // West
          } else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) {
            direction = 5; // South-West
          } else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) {
            direction = 4; // South
          } else {
            direction = 3; // South-East
          }

          // Update animation frame
          const newFrame = (creature.frame + 0.2) % 4; // Faster animation

          return {
            ...creature,
            x: newX,
            y: newY,
            direction,
            frame: newFrame,
            state: 1, // Walking
          };
        }

        // Check for nearby creatures when idle
        const nearbyCreature = world.creatures.find(c => {
          if (c.id === creature.id) return false;
          const dx = c.x - creature.x;
          const dy = c.y - creature.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < 2;
        });

        if (nearbyCreature) {
          // Look at nearby creature (8 directions)
          const dx = nearbyCreature.x - creature.x;
          const dy = nearbyCreature.y - creature.y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const normalizedAngle = (angle + 360) % 360;
          
          // Convert angle to 8 directions
          let direction = creature.direction;
          if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) {
            direction = 2; // East
          } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
            direction = 1; // North-East
          } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
            direction = 0; // North
          } else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) {
            direction = 7; // North-West
          } else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) {
            direction = 6; // West
          } else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) {
            direction = 5; // South-West
          } else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) {
            direction = 4; // South
          } else {
            direction = 3; // South-East
          }

          return {
            ...creature,
            direction,
            frame: 0,
            state: 0,
          };
        }

        return {
          ...creature,
          frame: 0,
          state: 0, // Idle
        };
      });

      // Sort creatures by their y position for correct rendering order
      const sortedCreatures = [...updatedCreatures].sort((a, b) => {
        const aIso = cartesianToIsometric(a.x, a.y);
        const bIso = cartesianToIsometric(b.x, b.y);
        return aIso.isoY - bIso.isoY;
      });

      // Update ear animation
      if (isWalletConnected) {
        walletConnectionTime = timestamp;
      }
      const timeSinceWalletConnection = timestamp - walletConnectionTime;
      const showSpecialEars = timeSinceWalletConnection < 3000; // 3 seconds

      // Draw all creatures
      sortedCreatures.forEach((creature) => {
        renderCreature(
          ctx,
          creature,
          offset.x + centerX,
          offset.y + centerY,
          creature.id === selectedCreature?.id,
          earAnimation,
          showSpecialEars
        );
      });

      ctx.restore();
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [world, selectedCreature, offset, zoom, earAnimation, isWalletConnected]);

  // Gérer l'animation des oreilles spéciales pendant 3 secondes après connexion wallet
  useEffect(() => {
    if (isWalletConnected) {
      setShowSpecialEars(true);
      const timer = setTimeout(() => setShowSpecialEars(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isWalletConnected]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2) / zoom + canvas.width / 2;
    const y = (e.clientY - rect.top - canvas.height / 2) / zoom + canvas.height / 2;

    // Adjust for offset and center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const adjustedX = x - offset.x - centerX;
    const adjustedY = y - offset.y - centerY;

    // Convert to cartesian
    const cartesian = isometricToCartesian(adjustedX, adjustedY);

    // Check if we clicked on a creature
    const clickedCreature = world.creatures.find((creature) => {
      const creatureIso = cartesianToIsometric(creature.x, creature.y);
      const dx = Math.abs(adjustedX - creatureIso.isoX);
      const dy = Math.abs(adjustedY - creatureIso.isoY);
      return dx < 20 && dy < 20; // Creature hitbox
    });

    if (clickedCreature) {
      setSelectedCreature(clickedCreature);
    } else if (selectedCreature) {
      // Move creature to the clicked position
      handleTileClick(cartesian.x, cartesian.y);
    }
  };

  // Draw background with static color
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  };

  // Draw the shadow beneath the island
  const drawIslandShadow = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    ctx.save();
    ctx.translate(centerX + offset.x, centerY + offset.y + 50);
    ctx.scale(1, 0.5); // Flatten to create ellipse
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();
    ctx.restore();
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        className="touch-none cursor-pointer"
      />
    </div>
  );
};