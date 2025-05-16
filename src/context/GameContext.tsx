import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Creature, WorldState } from '../types';
import { useSocket } from './SocketContext';
import { generateWorld } from '../utils/worldGenerator';
import { ethers } from 'ethers';

// Déclarer l'interface pour window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string>;
      on: (event: string, callback: (chainId: string) => void) => void;
      removeListener: (event: string, callback: (chainId: string) => void) => void;
    };
  }
}

const initialWorld: WorldState = {
  tiles: [],
  creatures: [],
  evolutionLevel: 0,
  connections: 0,
  fountains: [],
  pinkTrees: []
};

interface GameContextType {
  world: WorldState;
  selectedCreature: Creature | null;
  setSelectedCreature: (creature: Creature | null) => void;
  handleTileClick: (x: number, y: number) => void;
  isWalletConnected: boolean;
  setIsWalletConnected: (value: boolean) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  creatures: Creature[];
  setCreatures: (creatures: Creature[] | ((prev: Creature[]) => Creature[])) => void;
  currentChain: string | null;
  ethBalance: string;
  isAdmin: boolean;
  isOnSepolia: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export { useGame };

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [world, setWorld] = useState<WorldState>(initialWorld);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [currentChain, setCurrentChain] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const { sendCommand } = useSocket();

  // Vérifier si l'utilisateur est admin et sur Sepolia
  const isAdmin = walletAddress?.toLowerCase() === '0xbe2cdb3128d593a5cca1c0ea31df389dda785bb3';
  const isOnSepolia = currentChain === '0xaa36a7';

  // Mettre à jour la chaîne et le solde quand le wallet est connecté
  useEffect(() => {
    const updateChainAndBalance = async () => {
      if (window.ethereum && walletAddress) {
        try {
          // Obtenir la chaîne actuelle
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setCurrentChain(chainId);

          // Obtenir le solde ETH
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(walletAddress);
          setEthBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la chaîne et du solde:', error);
        }
      }
    };

    updateChainAndBalance();

    // Écouter les changements de chaîne
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId: string) => {
        setCurrentChain(chainId);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', (chainId: string) => {
          setCurrentChain(chainId);
        });
      }
    };
  }, [walletAddress]);

  useEffect(() => {
    // Generate initial world
    const generatedWorld = generateWorld();
    setWorld(generatedWorld);
  }, []);

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

        // Envoyer la mise à jour via sendCommand
        sendCommand({
          type: 'updateCreatures',
          payload: updatedCreatures
        });
      }
    }, 8000);

    return () => clearInterval(socialInterval);
  }, [world, sendCommand]);

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

      // Envoyer la commande via sendCommand
      sendCommand({
        type: 'moveCreature',
        payload: {
          creatureId: selectedCreature.id,
          targetX: x,
          targetY: y,
        }
        });
    },
    [selectedCreature, world, sendCommand]
  );

  // Mettre à jour les créatures quand le monde change
  useEffect(() => {
    setCreatures(world.creatures);
  }, [world.creatures]);

  const value = {
        world,
        selectedCreature,
        setSelectedCreature,
        handleTileClick,
        isWalletConnected,
        setIsWalletConnected,
        walletAddress,
        setWalletAddress,
    creatures,
    setCreatures,
    currentChain,
    ethBalance,
    isAdmin,
    isOnSepolia
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};