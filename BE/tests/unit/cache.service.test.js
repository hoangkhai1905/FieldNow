const cacheService = require('../../src/services/cache.service');
const { redisClient } = require('../../src/infrastructure/redis');

describe('Cache Service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await redisClient.del('fields:search:a', 'fields:search:b', 'fields:detail:1:date:all');
  });

  it('invalidates matching keys using SCAN instead of KEYS', async () => {
    await cacheService.set('fields:search:a', { id: 'a' });
    await cacheService.set('fields:search:b', { id: 'b' });
    await cacheService.set('fields:detail:1:date:all', { id: 'detail' });

    await cacheService.invalidate('fields:search:*');

    expect(redisClient.scan).toHaveBeenCalledWith('0', 'MATCH', 'fields:search:*', 'COUNT', 100);
    expect(redisClient.keys).toBeUndefined();
    expect(await cacheService.get('fields:search:a')).toBeNull();
    expect(await cacheService.get('fields:search:b')).toBeNull();
    expect(await cacheService.get('fields:detail:1:date:all')).toEqual({ id: 'detail' });
  });
});
