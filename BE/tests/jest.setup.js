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
let globalStore = {};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      set: jest.fn((key, value, mode, _px, _ttl) => {
        if (mode === 'NX' && !globalLocks[key]) {
          globalLocks[key] = value;
          return Promise.resolve('OK');
        }
        if (mode !== 'NX') {
          globalStore[key] = value;
          return Promise.resolve('OK');
        }
        return Promise.resolve(null);
      }),
      get: jest.fn((key) => Promise.resolve(globalStore[key] ?? null)),
      del: jest.fn((...keys) => {
        keys.forEach((key) => {
          delete globalStore[key];
          delete globalLocks[key];
        });
        return Promise.resolve(keys.length);
      }),
      scan: jest.fn((cursor, _match, pattern) => {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        const regex = new RegExp(`^${escaped}$`);
        const keys = Object.keys(globalStore).filter((key) => regex.test(key));
        return Promise.resolve(['0', cursor === '0' ? keys : []]);
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
