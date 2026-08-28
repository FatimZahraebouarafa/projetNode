// Test basique pour vérifier que l'environnement de test fonctionne
describe('Component Environment Test', () => {
  it('should perform basic math operations', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 2).toBe(4);
  });

  it('should handle string operations', () => {
    const testString = 'Hello World';
    expect(testString).toContain('Hello');
    expect(testString.length).toBeGreaterThan(5);
  });

  it('should handle array operations', () => {
    const testArray = [1, 2, 3, 4, 5];
    expect(testArray).toHaveLength(5);
    expect(testArray).toContain(3);
  });

  it('should handle object operations', () => {
    const testObject = { id: 1, name: 'Test' };
    expect(testObject).toHaveProperty('id');
    expect(testObject.name).toBe('Test');
  });
});