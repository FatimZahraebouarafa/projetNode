import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import LandingPage from '../../pages/LandingPage';

describe('LandingPage Component Tests', () => {
  it('should render landing page elements', () => {
    render(
      <Router>
        <LandingPage />
      </Router>
    );
    
    expect(screen.getByText('Excellence professionnelle à votre portée')).toBeInTheDocument();
    expect(screen.getByText('Connectez votre ambition avec l\'expertise qui transforme')).toBeInTheDocument();
    expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Professionnel')).toBeInTheDocument();
  });

  it('should render user buttons', () => {
    render(
      <Router>
        <LandingPage />
      </Router>
    );
    
    const userButtons = screen.getAllByText('Connexion');
    expect(userButtons).toHaveLength(2);
    
    const registerButtons = screen.getAllByText("S'inscrire");
    expect(registerButtons).toHaveLength(2);
  });

  it('should have correct text content for user card', () => {
    render(
      <Router>
        <LandingPage />
      </Router>
    );
    
    expect(screen.getByText('Réservez l\'expertise en un clic')).toBeInTheDocument();
  });

  it('should have correct text content for professional card', () => {
    render(
      <Router>
        <LandingPage />
      </Router>
    );
    
    expect(screen.getByText('Votre agenda, maîtrisé')).toBeInTheDocument();
  });
});