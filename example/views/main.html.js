//exports.iso = 'bundle';

exports.render = function ($, data) {
  var text ='ISO render on server side!';
  console.log('4) main.html.js,', text);
  $('p').after(text);
};