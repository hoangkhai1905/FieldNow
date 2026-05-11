class ValidateSlotStep {
  async execute(ctx) {
    const sTime = ctx.startTime.slice(0, 5);
    const eTime = ctx.endTime.slice(0, 5);

    const startH = parseInt(sTime.split(':')[0], 10);
    const endH = parseInt(eTime.split(':')[0], 10);
    const endM = parseInt(eTime.split(':')[1], 10);

    if (startH < 6 || endH > 22 || (endH === 22 && endM > 0)) {
      throw ctx.errors.validation('Thời gian đặt sân phải từ 06:00 đến 22:00');
    }

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
