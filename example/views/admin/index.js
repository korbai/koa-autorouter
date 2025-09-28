exports.index = async function(ctx, next) {
  ctx.state.name = 'admin';
  const $ = await ctx.view();
  if ($) {
    $('#hello').text(', ' + ctx.state.name + '!');
  }
};