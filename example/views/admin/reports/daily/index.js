exports.index = function *(next) {
  //this.data = this.data || {};
  this.state.name = 'Help about reports';
  var $ = yield this.view();
};
