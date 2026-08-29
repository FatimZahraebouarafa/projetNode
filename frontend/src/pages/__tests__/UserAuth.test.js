import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
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
    expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
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

  it('should handle input changes', () => {
    render(
      <Router>
        <UserAuth />
      </Router>
    );
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
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