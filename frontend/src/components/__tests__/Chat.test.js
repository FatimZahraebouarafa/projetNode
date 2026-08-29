import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chat from '../Chat';

// Mock messageService
jest.mock('../../services/messageService', () => ({
  default: {
    getMessages: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(() => Promise.resolve({ _id: 'msg1', content: 'test' })),
    markAsRead: jest.fn(() => Promise.resolve()),
  },
}));

describe('Chat Component Tests', () => {
  const mockAppointment = {
    _id: 'appointment1',
    date: '2026-08-27',
    startTime: '10:00',
    endTime: '11:00',
    professionalId: {
      _id: 'prof1',
      firstName: 'John',
      lastName: 'Doe',
    },
    userId: {
      _id: 'user1',
      firstName: 'Jane',
      lastName: 'Smith',
    },
  };

  const mockUser = {
    _id: 'user1',
    id: 'user1',
    role: 'USER',
    firstName: 'Jane',
    lastName: 'Smith',
  };

  it('should show error when appointment is missing', () => {
    render(<Chat appointment={null} currentUser={mockUser} />);
    expect(screen.getByText('Erreur: Données manquantes')).toBeInTheDocument();
  });

  it('should show error when user is missing', () => {
    render(<Chat appointment={mockAppointment} currentUser={null} />);
    expect(screen.getByText('Erreur: Données manquantes')).toBeInTheDocument();
  });

  it('should render chat container with valid data', () => {
    render(<Chat appointment={mockAppointment} currentUser={mockUser} />);
    // The component should render something (not crash)
    expect(document.body).toBeTruthy();
  });
});