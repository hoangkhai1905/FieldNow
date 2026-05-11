class ValidateSlotStep {
  async execute(ctx) {
    const sTime = ctx.startTime.slice(0, 5);
    const eTime = ctx.endTime.slice(0, 5);



    if (sTime >= eTime) {
      throw ctx.errors.validation('Giờ kết thúc phải sau giờ bắt đầu');
    }

    ctx.sTime = sTime;
    ctx.eTime = eTime;
    ctx.reqStart = new Date(`1970-01-01T${sTime}:00Z`);
    ctx.reqEnd = new Date(`1970-01-01T${eTime}:00Z`);
  }
}

module.exports = ValidateSlotStep;
