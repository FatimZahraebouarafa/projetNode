// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock for axios and other dependencies
jest.mock('axios', () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock authService
jest.mock('./services/api', () => ({
  authService: {
    getCurrentUser: jest.fn(() => ({ firstName: 'Test', role: 'USER' })),
    login: jest.fn(() => Promise.resolve({ role: 'USER' })),
    register: jest.fn(() => Promise.resolve({ role: 'USER' })),
    logout: jest.fn(),
  },
  userService: {
    getProfessionals: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock messageService
jest.mock('./services/messageService', () => ({
  default: {
    getMessages: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(() => Promise.resolve({ _id: 'msg1', content: 'test' })),
    markAsRead: jest.fn(() => Promise.resolve()),
    getUnreadCount: jest.fn(() => Promise.resolve({ unreadCount: 0 })),
  },
}));

// Mock appointmentService
jest.mock('./services/appointmentService', () => ({
  default: {
    getUserAppointments: jest.fn(() => Promise.resolve([])),
    createAppointment: jest.fn(() => Promise.resolve({})),
    cancelAppointment: jest.fn(() => Promise.resolve({})),
  },
}));