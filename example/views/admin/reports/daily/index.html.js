var moment = require('moment');

// flag for browserify and the name of this bundle in the browser
exports.iso = 'mybundle';

exports.render = function($, data) {
  var dt = moment().format();
  // rendben, kész
  $('#hello').text(', ' + data.name +', at ' + dt + '!');
};
