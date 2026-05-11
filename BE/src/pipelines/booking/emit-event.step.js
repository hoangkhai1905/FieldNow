class EmitEventStep {
  async execute(ctx) {
    ctx.bookingEvents.emit('BOOKING_CREATED', {
      bookingId: ctx.booking.id,
      slotId: ctx.booking.slot_id,
      userId: ctx.userId,
    });
  }
}

module.exports = EmitEventStep;
