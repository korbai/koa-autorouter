exports.index = function *(next) {
  this.state.name = 'admin';
  var $ = yield this.view();
  $('#hello').text(', ' + this.state.name + '!');
};