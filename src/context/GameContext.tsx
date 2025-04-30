import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Creature, GameContextType, WorldState } from '../types';
import { useSocket } from './SocketContext';
import { generateWorld } from '../utils/worldGenerator';

const initialWorld: WorldState = {
  tiles: [],
  creatures: [],
  evolutionLevel: 0,
  connections: 0
};

export interface GameContextType {
  world: WorldState;
  selectedCreature: Creature | null;
  setSelectedCreature: (creature: Creature | null) => void;
  handleTileClick: (x: number, y: number) => void;
  isWalletConnected: boolean;
  setIsWalletConnected: (connected: boolean) => void;
}

const GameContext = createContext<GameContextType>({
  world: initialWorld,
  selectedCreature: null,
  setSelectedCreature: () => {},
  handleTileClick: () => {},
  isWalletConnected: false,
  setIsWalletConnected: () => {},
});

export const useGame = () => useContext(GameContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [world, setWorld] = useState<WorldState>(initialWorld);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    // Generate initial world if no socket connection
    if (!socket) {
      const generatedWorld = generateWorld();
      setWorld(generatedWorld);
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Listen for world updates from server
    socket.on('worldUpdate', (updatedWorld: WorldState) => {
      setWorld(updatedWorld);
    });

    // Request initial world state
    socket.emit('getWorld');

    return () => {
      socket.off('worldUpdate');
    };
  }, [socket]);

  // Creature social behavior (group and separate when idle)
  useEffect(() => {
    const socialInterval = setInterval(() => {
      if (world.creatures.length < 2) return;

      const now = Date.now();
      const needsSocial = world.creatures.every(
        (c) => now - c.lastInteraction > 5000
      );

      if (needsSocial) {
        // Group creatures towards center
        const centerX = world.creatures.reduce((sum, c) => sum + c.x, 0) / world.creatures.length;
        const centerY = world.creatures.reduce((sum, c) => sum + c.y, 0) / world.creatures.length;

        const updatedCreatures = world.creatures.map((creature) => ({
          ...creature,
          targetX: centerX + (Math.random() * 2 - 1),
          targetY: centerY + (Math.random() * 2 - 1),
        }));

        setWorld((prev) => ({
          ...prev,
          creatures: updatedCreatures,
        }));

        // Emit update if connected
        if (socket) {
          socket.emit('updateCreatures', updatedCreatures);
        }
      }
    }, 8000);

    return () => clearInterval(socialInterval);
  }, [world, socket]);

  const handleTileClick = useCallback(
    (x: number, y: number) => {
      if (!selectedCreature) return;

      const updatedCreatures = world.creatures.map((creature) =>
        creature.id === selectedCreature.id
          ? {
              ...creature,
              targetX: x,
              targetY: y,
              lastInteraction: Date.now(),
            }
          : creature
      );

      setWorld((prev) => ({
        ...prev,
        creatures: updatedCreatures,
      }));

      // Emit update if connected
      if (socket) {
        socket.emit('moveCreature', {
          creatureId: selectedCreature.id,
          targetX: x,
          targetY: y,
        });
      }
    },
    [selectedCreature, world, socket]
  );

  return (
    <GameContext.Provider
      value={{
        world,
        selectedCreature,
        setSelectedCreature,
        handleTileClick,
        isWalletConnected,
        setIsWalletConnected,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};