const AcquireLockStep = require('../../src/modules/bookings/pipeline/acquire-lock.step');
const { errors } = require('../../src/common/utils/errors');

describe('AcquireLockStep', () => {
  it('continues without a Redis lock when Redis is unavailable', async () => {
    const step = new AcquireLockStep();
    const redisError = new Error('ERR max request limit exceeded');
    const logger = { warn: jest.fn() };
    const ctx = {
      fieldId: 'field-1',
      date: '2026-05-20',
      acquireBookingLock: jest.fn().mockRejectedValue(redisError),
      releaseBookingLock: jest.fn(),
      cleanup: [],
      logger,
      errors,
    };

    await expect(step.execute(ctx)).resolves.toBeUndefined();

    expect(ctx.cleanup).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledWith(
      { err: redisError, fieldId: 'field-1', date: '2026-05-20' },
      '[Booking] Redis lock unavailable; relying on database overlap guard'
    );
  });

  it('maps an existing Redis lock to a booking conflict', async () => {
    const step = new AcquireLockStep();
    const ctx = {
      fieldId: 'field-1',
      date: '2026-05-20',
      acquireBookingLock: jest.fn().mockResolvedValue(null),
      cleanup: [],
      errors,
    };

    await expect(step.execute(ctx)).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
    });
  });

  it('does not fail the request when lock release fails', async () => {
    const step = new AcquireLockStep();
    const releaseError = new Error('ERR max request limit exceeded');
    const logger = { warn: jest.fn() };
    const ctx = {
      fieldId: 'field-1',
      date: '2026-05-20',
      acquireBookingLock: jest.fn().mockResolvedValue('lock-value'),
      releaseBookingLock: jest.fn().mockRejectedValue(releaseError),
      cleanup: [],
      logger,
      errors,
    };

    await step.execute(ctx);
    await expect(ctx.cleanup[0]()).resolves.toBeUndefined();

    expect(ctx.releaseBookingLock).toHaveBeenCalledWith('field-1', '2026-05-20', 'lock-value');
    expect(logger.warn).toHaveBeenCalledWith(
      { err: releaseError, fieldId: 'field-1', date: '2026-05-20' },
      '[Booking] Redis lock release failed'
    );
  });
});
