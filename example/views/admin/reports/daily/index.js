exports.index = async function(ctx, next) {
  // ctx.data = ctx.data || {};
  ctx.state.name = 'Help about reports';
  const $ = await ctx.view();
};
