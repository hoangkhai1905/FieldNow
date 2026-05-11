class AcquireLockStep {
  async execute(ctx) {
    const lockValue = await ctx.acquireBookingLock(ctx.fieldId, ctx.date);
    if (!lockValue) {
      throw ctx.errors.conflict('Hệ thống đang xử lý yêu cầu đặt sân khác cho khung giờ này. Vui lòng thử lại sau.');
    }

    ctx.lockValue = lockValue;
    ctx.cleanup.push(async () => {
      await ctx.releaseBookingLock(ctx.fieldId, ctx.date, lockValue);
    });
  }
}

module.exports = AcquireLockStep;
