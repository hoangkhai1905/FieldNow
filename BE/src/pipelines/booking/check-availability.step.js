class CheckAvailabilityStep {
  async execute(ctx) {
    const field = await ctx.prisma.field.findUnique({ where: { id: ctx.fieldId } });
    if (!field) {
      throw ctx.errors.notFound('Field');
    }
    ctx.field = field;

    const overlappingBooking = await ctx.prisma.booking.findFirst({
      where: {
        field_id: ctx.fieldId,
        date: new Date(ctx.date),
        status: { in: ['PENDING', 'CONFIRMED'] },
        start_time: { lt: ctx.reqEnd },
        end_time: { gt: ctx.reqStart },
      },
    });

    if (overlappingBooking) {
      throw ctx.errors.conflict('Khung giờ này đã có người đặt hoặc bị trùng với lịch khác');
    }
  }
}

module.exports = CheckAvailabilityStep;
