import React, { useEffect } from 'react';
import { IslandWorld } from './components/IslandWorld';
import { WalletConnector } from './components/WalletConnector';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';

function App() {
  useEffect(() => {
    document.title = "Floating Island World";
  }, []);

  return (
    <SocketProvider>
      <GameProvider>
        <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-pink-700 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <WalletConnector />
          </div>
          <IslandWorld />
        </div>
      </GameProvider>
    </SocketProvider>
  );
}

export default App;