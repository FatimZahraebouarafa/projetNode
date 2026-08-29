import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import UserAuth from '../UserAuth';

// Mock authService
jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn(() => Promise.resolve({ role: 'USER' })),
    register: jest.fn(() => Promise.resolve({ role: 'USER' })),
  },
}));

describe('UserAuth Component Tests', () => {
  it('should render login form by default', () => {
    render(
      <Router>
        <UserAuth />
      </Router>
    );
    
    expect(screen.getByText('Connexion Utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Mot de passe')).toBeInTheDocument();
  });

  it('should render register form when mode is register', () => {
    render(
      <Router>
        <UserAuth />
      </Router>
    );
    
    // Click on register link
    const registerLink = screen.getByText("S'inscrire");
    fireEvent.click(registerLink);
    
    expect(screen.getByText('Inscription Utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Prénom')).toBeInTheDocument();
    expect(screen.getByText('Nom')).toBeInTheDocument();
  });

  it('should toggle between login and register', () => {
    render(
      <Router>
        <UserAuth />
      </Router>
    );
    
    // Initially in login mode
    expect(screen.getByText('Connexion Utilisateur')).toBeInTheDocument();
    
    // Switch to register
    const registerLink = screen.getByText("S'inscrire");
    fireEvent.click(registerLink);
    expect(screen.getByText('Inscription Utilisateur')).toBeInTheDocument();
    
    // Switch back to login
    const loginLink = screen.getByText('Se connecter');
    fireEvent.click(loginLink);
    expect(screen.getByText('Connexion Utilisateur')).toBeInTheDocument();
  });

  it('should have submit button', () => {
    render(
      <Router>
        <UserAuth />
      </Router>
    );
    
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });

  it('should have back button', () => {
    render(
      <Router>
        <UserAuth />
      </Router>
    );
    
    expect(screen.getByText('← Retour')).toBeInTheDocument();
  });
});