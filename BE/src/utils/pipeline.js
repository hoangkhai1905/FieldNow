class Pipeline {
  constructor() {
    this.steps = [];
  }

  use(step) {
    this.steps.push(step);
    return this;
  }

  async execute(context) {
    const ctx = context || {};
    if (!ctx.cleanup) {
      ctx.cleanup = [];
    }

    try {
      for (const step of this.steps) {
        await step.execute(ctx);
      }
      return ctx.result ?? ctx.booking ?? ctx;
    } finally {
      if (ctx.cleanup?.length) {
        for (const cleanup of ctx.cleanup.reverse()) {
          await cleanup();
        }
      }
    }
  }
}

module.exports = Pipeline;
