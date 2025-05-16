import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CreatureState, CreatureType, CreaturePattern, Creature as CreatureInterface, WorldState as WorldStateType } from '../types';

// Type minimal pour une créature (à adapter selon ton modèle)
export interface Creature {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: CreatureState;
  direction: number;
  animation: any;
  bubble: string;
  color: string;
  frame?: number;
  type?: CreatureType;
  lastInteraction?: number;
  evolutionStage?: number;
  tools?: any[];
  pattern: CreaturePattern;
}

export interface WorldState {
  creatures: Creature[];
  tiles?: any[];
  fountains?: Array<{ x: number; y: number }>;
  pinkTrees?: Array<{ x: number; y: number }>;
  isWalletConnected?: boolean;
  evolutionLevel: number;
  connections: number;
  // Ajoute d'autres propriétés si le serveur envoie plus de données
}

interface SocketContextType {
  world: WorldStateType;
  sendCommand: (cmd: any) => void;
  setWorld: (world: WorldStateType | ((prev: WorldStateType) => WorldStateType)) => void;
}

export const SocketContext = createContext<SocketContextType>({
  world: { 
    creatures: [], 
    tiles: [], 
    fountains: [], 
    pinkTrees: [],
    evolutionLevel: 0,
    connections: 0
  },
  sendCommand: () => {},
  setWorld: () => {}
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [world, setWorld] = useState<WorldStateType>({ 
    creatures: [], 
    tiles: [], 
    fountains: [], 
    pinkTrees: [],
    evolutionLevel: 0,
    connections: 0
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new window.WebSocket('ws://localhost:3001');
    
    ws.current.onopen = () => {
      console.log('WebSocket connecté');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'worldUpdate') {
          console.log("world reçu du serveur :", msg.payload);
          setWorld({
            creatures: msg.payload.creatures || [],
            tiles: msg.payload.tiles || [],
            fountains: msg.payload.fountains || [],
            pinkTrees: msg.payload.pinkTrees || [],
            evolutionLevel: msg.payload.evolutionLevel || 0,
            connections: msg.payload.connections || 0
          });
        }
      } catch (e) {
        console.error('Erreur parsing message:', e);
      }
    };

    ws.current.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket déconnecté, tentative de reconnexion...');
      reconnectTimeout.current = setTimeout(connect, 5000);
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      ws.current?.close();
    };
  }, []);

  const sendCommand = (cmd: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'command', payload: cmd }));
    }
  };

  return (
    <SocketContext.Provider value={{ world, sendCommand, setWorld }}>
      {children}
    </SocketContext.Provider>
  );
};