import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import UserDashboard from '../UserDashboard';

// Mock pour les services
jest.mock('../../services/api', () => ({
  authService: {
    getCurrentUser: jest.fn(() => ({ firstName: 'Test', role: 'USER' })),
    logout: jest.fn(),
  },
  userService: {
    getProfessionals: jest.fn(() => Promise.resolve([])),
  },
}));

describe('UserDashboard Component Tests', () => {
  it('should render UserDashboard component without crashing', () => {
    render(
      <Router>
        <UserDashboard />
      </Router>
    );
    // Component should render without crashing
    expect(document.body).toBeTruthy();
  });

  it('should have logout button', () => {
    render(
      <Router>
        <UserDashboard />
      </Router>
    );
    
    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });
});