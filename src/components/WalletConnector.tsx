import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const WalletConnector: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { isWalletConnected, walletAddress, setIsWalletConnected, setWalletAddress, ethBalance, isOnSepolia } = useGame();

  // Check if ethereum is available and get account
  useEffect(() => {
    const checkConnection = async () => {
      if ((window as any).ethereum) {
        try {
          await (window as any).ethereum.request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
              if (accounts.length > 0) {
                setIsWalletConnected(true);
                setWalletAddress(accounts[0].toLowerCase());
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
    console.log('Tentative de connexion du wallet...');
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Comptes récupérés:', accounts);
        setWalletAddress(accounts[0].toLowerCase());
        setIsWalletConnected(true);
        console.log('Wallet connecté avec succès');
      } else {
        console.log('MetaMask n\'est pas installé');
        alert('Veuillez installer MetaMask pour utiliser cette fonctionnalité');
      }
      } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setIsWalletConnected(false);
      setWalletAddress(null);
    }
  };

  const disconnectWallet = () => {
    console.log('Déconnexion du wallet...');
    setIsWalletConnected(false);
    setWalletAddress(null);
    console.log('Wallet déconnecté');
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isAdmin = walletAddress === '0xbe2CDB3128d593a5cCa1c0Ea31Df389dDA785bB3';

  return (
    <div className="flex items-center space-x-4">
      {isWalletConnected && isOnSepolia && (
        <div className="bg-gray-800 text-white px-4 py-2 rounded-full">
          {parseFloat(ethBalance).toFixed(4)} ETH
        </div>
      )}
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center space-x-2 py-2 px-4 rounded-full transition-colors ${
            isWalletConnected
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-white'
        }`}
      >
        <Wallet className="h-5 w-5" />
          <span>{isWalletConnected ? formatAddress(walletAddress!) : 'Connect Wallet'}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1">
              {!isWalletConnected ? (
              <button
                onClick={connectWallet}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                <div className="block px-4 py-2 text-sm text-gray-500 border-b">
                    {formatAddress(walletAddress!)}
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
      {isAdmin && (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full"
          onClick={() => window.location.href = '/admin'}
        >
          Admin
        </button>
      )}
    </div>
  );
};