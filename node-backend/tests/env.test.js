require('dotenv').config({ path: './.env' });

describe('Environment Variables', () => {
  it('should have JSON_PLACEHOLDER_URL set', () => {
    expect(process.env.JSON_PLACEHOLDER_URL).toBeDefined();
    expect(process.env.JSON_PLACEHOLDER_URL).toBe('https://jsonplaceholder.typicode.com');
  });

  it('should have JWT_SECRET set', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it('should have RABBITMQ_URL set', () => {
    expect(process.env.RABBITMQ_URL).toBeDefined();
  });
});