class CreateBookingStep {
  async execute(ctx) {
    const booking = await ctx.prisma.$transaction(async (tx) => {
      const field = await tx.field.findUnique({ where: { id: ctx.fieldId } });
      if (!field) {
        throw ctx.errors.notFound('Field');
      }

      const slot = await tx.fieldSlot.findFirst({
        where: {
          field_id: ctx.fieldId,
          date: new Date(ctx.date),
          start_time: ctx.reqStart,
          end_time: ctx.reqEnd,
        },
      });

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const newBooking = await ctx.bookingRepository.createBooking({
        userId: ctx.userId,
        fieldId: ctx.fieldId,
        slotId: slot?.id ?? null,
        date: new Date(ctx.date),
        startTime: ctx.reqStart,
        endTime: ctx.reqEnd,
        expiresAt,
      }, tx);

      return ctx.normalizeBookingSlot({ ...newBooking, slot: slot ?? null });
    });

    ctx.booking = booking;
    ctx.result = booking;
  }
}

module.exports = CreateBookingStep;
