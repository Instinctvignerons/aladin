import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // In a production environment, you would connect to your actual server
    // For development/demo purposes, we'll simulate this behavior locally
    const socketInstance = io('https://floating-island-demo-server.example.com', {
      autoConnect: false,
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    // Since we can't actually connect in this demo, we'll fake the connection status
    // In a real app, you would use the actual socket connection events
    setConnected(false);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};