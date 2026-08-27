import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test basique pour vérifier que l'environnement de test fonctionne
describe('Component Environment Test', () => {
  it('should render without crashing', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should handle user input', () => {
    const TestComponent = () => (
      <div>
        <input data-testid="email-input" placeholder="Email" />
      </div>
    );
    render(<TestComponent />);
    const input = screen.getByTestId('email-input');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(input.value).toBe('test@example.com');
  });

  it('should handle button clicks', () => {
    let clicked = false;
    const TestComponent = () => (
      <button onClick={() => clicked = true}>Click me</button>
    );
    render(<TestComponent />);
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    expect(clicked).toBe(true);
  });
});