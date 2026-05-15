class CheckAvailabilityStep {
  async execute(ctx) {
    const field = await ctx.fieldRepository.findById(ctx.fieldId);
    if (!field) {
      throw ctx.errors.notFound('Field');
    }
    ctx.field = field;

    const openStr = field.open_time.toISOString().slice(11, 16);
    const closeStr = field.close_time.toISOString().slice(11, 16);

    if (ctx.sTime < openStr || ctx.eTime > closeStr) {
      throw ctx.errors.validation(`Thời gian đặt sân phải nằm trong khung giờ hoạt động của sân (${openStr} - ${closeStr})`);
    }

    const overlappingBooking = await ctx.bookingRepository.findOverlappingActive(
      ctx.fieldId,
      ctx.date,
      ctx.reqStart,
      ctx.reqEnd
    );

    if (overlappingBooking) {
      throw ctx.errors.conflict('Khung giờ này đã có người đặt hoặc bị trùng với lịch khác');
    }
  }
}

module.exports = CheckAvailabilityStep;
