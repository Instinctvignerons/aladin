import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock des composants enfants pour simplifier le test
jest.mock('../components/IslandWorld', () => () => <div data-testid="island-world">Island World</div>);
jest.mock('../components/WalletConnector', () => () => <div data-testid="wallet-connector">Wallet Connector</div>);
jest.mock('../pages/AdminPage', () => () => <div data-testid="admin-page">Admin Page</div>);

describe('App', () => {
  it('devrait afficher le composant IslandWorld par défaut', () => {
    render(<App />);
    expect(screen.getByTestId('island-world')).toBeInTheDocument();
  });

  it('devrait basculer vers la page admin quand on clique sur le bouton', () => {
    render(<App />);
    const adminButton = screen.getByText('Admin');
    fireEvent.click(adminButton);
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
  });
}); 