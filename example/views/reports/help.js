exports.index = function *(next) {
  this.state.name = 'Help about reports';
  var $ = yield this.view();
  $('#hello').text(', ' + this.state.name + '!');
};