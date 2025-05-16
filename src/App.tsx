import React, { useEffect, useState } from 'react';
import { IslandWorld } from './components/IslandWorld';
import { WalletConnector } from './components/WalletConnector';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import AdminPage from './pages/AdminPage';
import { useGame } from './context/GameContext';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const AdminButton: React.FC = () => {
  const { walletAddress } = useGame();
  console.log("walletAddress dans AdminButton:", walletAddress);
  
  const isAdmin = walletAddress?.toLowerCase() === '0xbe2cdb3128d593a5cca1c0ea31df389dda785bb3';
  console.log("isAdmin:", isAdmin);

  if (!isAdmin) return null;

  return (
    <Link 
      to="/admin"
      className="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
    >
      Admin
    </Link>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-pink-700 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <WalletConnector />
        <AdminButton />
      </div>
      <Routes>
        <Route path="/" element={<IslandWorld />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
};

function App() {
  useEffect(() => {
    document.title = "Floating Island World";
  }, []);

  return (
    <Router>
    <SocketProvider>
      <GameProvider>
          <AppContent />
      </GameProvider>
    </SocketProvider>
    </Router>
  );
}

export default App;