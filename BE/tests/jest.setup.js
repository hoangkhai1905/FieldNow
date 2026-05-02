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

let globalLocks = {}; // Global simple in-memory lock for testing

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      set: jest.fn((key, value, mode, px, ttl) => {
        if (mode === 'NX' && !globalLocks[key]) {
          globalLocks[key] = value;
          return Promise.resolve('OK');
        }
        return Promise.resolve(null);
      }),
      eval: jest.fn((script, numKeys, key, value) => {
        if (globalLocks[key] === value) {
          delete globalLocks[key];
          return Promise.resolve(1);
        }
        return Promise.resolve(0);
      }),
      quit: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };
  });
});
