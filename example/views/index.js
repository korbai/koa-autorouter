'use strict';

exports.render = function *() {
  console.log('2) generator render before');
  this.$('#hello').after(' Generator render!');
//  yield next; // !TODO, not supported yet
//  console.log('x) generator render after');
//  this.$('#list').append('<li>six</li>');
};

exports.index = function *(next) {
  this.state.name = 'Server';
  console.log('1) controller');
  let $ = yield this.view();
  $('#hello').text(', from the ' + this.state.name + '!');
};