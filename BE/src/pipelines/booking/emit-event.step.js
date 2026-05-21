class EmitEventStep {
  async execute(ctx) {
    const payload = {
      bookingId: ctx.booking.id,
      slotId: ctx.booking.slot_id,
      userId: ctx.userId,
      delayMs: ctx.booking.expires_at ? new Date(ctx.booking.expires_at).getTime() - Date.now() : undefined,
    };

    if (ctx.bookingSideEffects?.scheduleBookingCreatedSideEffects) {
      try {
        await ctx.bookingSideEffects.scheduleBookingCreatedSideEffects(payload);
      } catch (error) {
        ctx.logger?.warn(
          { err: error, bookingId: ctx.booking.id },
          '[Booking] Failed to schedule booking expiration job'
        );
      }
      return;
    }

    ctx.bookingEvents.emit('BOOKING_CREATED', payload);
  }
}

module.exports = EmitEventStep;
