exports.index = async function(ctx, next) {
  ctx.state.name = 'Help about reports';
  const $ = await ctx.view();
  if ($) {
    $('#hello').text(', ' + ctx.state.name + '!');
  }
};