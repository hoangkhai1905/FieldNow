describe('redis infrastructure', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    jest.resetModules();

    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('builds TLS connection options for rediss URLs', () => {
    process.env.REDIS_URL = 'rediss://default:secret@example.upstash.io:6379';
    jest.resetModules();

    const { buildRedisConnectionOptions } = require('../../src/infrastructure/redis');

    expect(buildRedisConnectionOptions()).toMatchObject({
      host: 'example.upstash.io',
      port: 6379,
      username: 'default',
      password: 'secret',
      tls: {
        servername: 'example.upstash.io',
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  });

  it('keeps plain Redis URLs without TLS options', () => {
    process.env.REDIS_URL = 'redis://localhost:6379/2';
    jest.resetModules();

    const { buildRedisConnectionOptions } = require('../../src/infrastructure/redis');
    const connectionOptions = buildRedisConnectionOptions();

    expect(connectionOptions).toMatchObject({
      host: 'localhost',
      port: 6379,
      db: 2,
    });
    expect(connectionOptions.tls).toBeUndefined();
  });
});
