jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    let locks = {}; // Simple in-memory lock for testing
    return {
      on: jest.fn(),
      set: jest.fn((key, value, mode, px, ttl) => {
        if (mode === 'NX' && !locks[key]) {
          locks[key] = value;
          return Promise.resolve('OK');
        }
        return Promise.resolve(null);
      }),
      eval: jest.fn((script, numKeys, key, value) => {
        if (locks[key] === value) {
          delete locks[key];
          return Promise.resolve(1);
        }
        return Promise.resolve(0);
      }),
      quit: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };
  });
});
