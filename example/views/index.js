'use strict';

exports.render = async function(ctx, next) {
  console.log('2) async render before');
  ctx.$('#hello').after(' Async render!');
  // await next(); // Can be supported in future versions
  // console.log('x) async render after');
  // ctx.$('#list').append('<li>six</li>');
};

exports.index = async function(ctx, next) {
  ctx.state.name = 'Modern Server';
  console.log('1) modern controller');
  const $ = await ctx.view();
  if ($) {
    $('#hello').text(', from the ' + ctx.state.name + '!');
  }
};