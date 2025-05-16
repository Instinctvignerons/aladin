import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { walletAddress } = useGame();
  const isAdmin = walletAddress?.toLowerCase() === '0xbe2cdb3128d593a5cca1c0ea31df389dda785bb3';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 