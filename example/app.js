const path = require('path');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const render = require('koa-views');
const autorouter = require('../'); // koa-autorouter

const app = new Koa();

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    console.error('Error:', err);
  }
});

// Body parser for POST requests
app.use(bodyParser());

// Merge request data for controller simplicity
app.use(async (ctx, next) => {
  ctx.data = {
    ...ctx.request.body,
    ...ctx.query,
    ...ctx.params
  };
  await next();
});

// Template engine setup
const viewOptions = {
  root: path.join(__dirname, 'views'),
  extension: 'html',
  map: {
    html: 'handlebars' // You can change this to your preferred engine
  }
};

app.use(render(viewOptions.root, viewOptions));

// Autorouter setup
const autorouterOptions = {
  root: path.join(__dirname, 'views/'),
  ext: '.html'
};

app.use(autorouter(autorouterOptions));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Modern Koa autorouter example running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  GET  / -> views/index.js');
  console.log('  GET  /admin -> views/admin/index.js');
  console.log('  GET  /admin/help -> views/admin/help.html (standalone)');
  console.log('  GET  /admin/reports/daily -> views/admin/reports/daily/index.js');
  console.log('  GET  /reports/help -> views/reports/help.js');
});
