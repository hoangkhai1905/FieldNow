class EmitEventStep {
  async execute(ctx) {
    const payload = {
      bookingId: ctx.booking.id,
      slotId: ctx.booking.slot_id,
      userId: ctx.userId,
      delayMs: ctx.booking.expires_at ? new Date(ctx.booking.expires_at).getTime() - Date.now() : undefined,
    };

    if (ctx.bookingSideEffects?.scheduleBookingCreatedSideEffects) {
      await ctx.bookingSideEffects.scheduleBookingCreatedSideEffects(payload);
      return;
    }

    ctx.bookingEvents.emit('BOOKING_CREATED', payload);
  }
}

module.exports = EmitEventStep;
