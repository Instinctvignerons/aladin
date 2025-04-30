import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const WalletConnector: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { setIsWalletConnected } = useGame();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Check if ethereum is available and get account
  useEffect(() => {
    const checkConnection = async () => {
      // For demo purposes, we're just simulating wallet connection
      // In a real app, you would use ethers.js or web3.js to connect
      if ((window as any).ethereum) {
        try {
          await (window as any).ethereum.request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
              if (accounts.length > 0) {
                setConnected(true);
                setAddress(accounts[0]);
              }
            });
        } catch (error) {
          console.error("Failed to connect to wallet:", error);
        }
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
          .then((accounts: string[]) => {
            setConnected(true);
            setAddress(accounts[0]);
            setShowDropdown(false);
            
            // Activate special ear animation for 3 seconds
            setIsWalletConnected(true);
            setTimeout(() => {
              setIsWalletConnected(false);
            }, 3000);
          });
      } catch (error) {
        console.error("Failed to connect to wallet:", error);
      }
    } else {
      alert("Please install a Web3 wallet like MetaMask to use this feature.");
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setAddress(null);
    setShowDropdown(false);
    setIsWalletConnected(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center space-x-2 py-2 px-4 rounded-full transition-colors ${
          connected
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-white'
        }`}
      >
        <Wallet className="h-5 w-5" />
        <span>{connected ? formatAddress(address!) : 'Connect Wallet'}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1">
            {!connected ? (
              <button
                onClick={connectWallet}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                <div className="block px-4 py-2 text-sm text-gray-500 border-b">
                  {formatAddress(address!)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};