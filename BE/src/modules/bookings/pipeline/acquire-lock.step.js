class AcquireLockStep {
  async execute(ctx) {
    let lockValue;
    try {
      lockValue = await ctx.acquireBookingLock(ctx.fieldId, ctx.date);
    } catch (error) {
      ctx.logger?.warn(
        { err: error, fieldId: ctx.fieldId, date: ctx.date },
        '[Booking] Redis lock unavailable; relying on database overlap guard'
      );
      return;
    }

    if (!lockValue) {
      throw ctx.errors.conflict('Hệ thống đang xử lý yêu cầu đặt sân khác cho khung giờ này. Vui lòng thử lại sau.');
    }

    ctx.lockValue = lockValue;
    ctx.cleanup.push(async () => {
      try {
        await ctx.releaseBookingLock(ctx.fieldId, ctx.date, lockValue);
      } catch (error) {
        ctx.logger?.warn(
          { err: error, fieldId: ctx.fieldId, date: ctx.date },
          '[Booking] Redis lock release failed'
        );
      }
    });
  }
}

module.exports = AcquireLockStep;
