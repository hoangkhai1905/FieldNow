class CreateBookingStep {
  async execute(ctx) {
    let booking;

    try {
      booking = await ctx.prisma.$transaction(async (tx) => {
        const field = await ctx.fieldRepository.findById(ctx.fieldId, tx);
        if (!field) {
          throw ctx.errors.notFound('Field');
        }

        const slot = await ctx.slotRepository.findExact(
          ctx.fieldId,
          ctx.date,
          ctx.reqStart,
          ctx.reqEnd,
          tx
        );
        if (slot?.is_locked) {
          throw ctx.errors.conflict('Khung giờ này đang bị khóa bởi chủ sân');
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Calculate duration in hours
        const durationMs = ctx.reqEnd.getTime() - ctx.reqStart.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const totalPrice = Math.round(durationHours * Number(field.price_per_hour));

        const newBooking = await ctx.bookingRepository.createBooking({
          userId: ctx.userId,
          fieldId: ctx.fieldId,
          slotId: slot?.id ?? null,
          date: new Date(ctx.date),
          startTime: ctx.reqStart,
          endTime: ctx.reqEnd,
          totalPrice,
          expiresAt,
        }, tx);

        // Create initial payment record
        await tx.payment.create({
          data: {
            booking_id: newBooking.id,
            amount: totalPrice,
            provider: 'SEPAY', // Mặc định ban đầu
            status: 'PENDING',
          }
        });

        return ctx.normalizeBookingSlot({ ...newBooking, slot: slot ?? null });
      });
    } catch (error) {
      const message = `${error?.message || ''} ${error?.meta?.database_error || ''}`;
      if (message.includes('Booking_no_active_overlap')) {
        throw ctx.errors.conflict('Khung giờ này đã có người đặt hoặc bị trùng với lịch khác');
      }
      throw error;
    }

    ctx.booking = booking;
    ctx.result = booking;
  }
}

module.exports = CreateBookingStep;
