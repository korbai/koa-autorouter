# koa-autorouter

Modern autorouter middleware for Koa.js v2+ with async/await support, based on folder/file hierarchy.

## ✨ Features
- 🚀 **Modern**: Full async/await support for Koa v2+
- 📁 **File-based routing**: Routes automatically generated from directory structure
- 🎯 **Convention over configuration**: Minimal setup, maximum productivity
- 🔧 **Flexible**: Works with any template engine
- 📦 **TypeScript support**: Full type definitions included
- 🛡️ **Secure**: Updated dependencies with security patches

## 🔄 Migration from v1.x

**v1.x (Generator functions)**:
```js
exports.index = function *(next) {
  this.state.name = 'Server';
  yield this.view();
};
```

**v2.x (Async/await)**:
```js
exports.index = async function(ctx, next) {
  ctx.state.name = 'Modern Server';
  await ctx.view();
};
```

## 📦 Installation
```bash
npm install koa-autorouter
```

## 🚀 Quick Start

**app.js**
```js
const Koa = require('koa');
const path = require('path');
const views = require('koa-views');
const autorouter = require('koa-autorouter');

const app = new Koa();

// Setup template engine (example with Handlebars)
app.use(views(path.join(__dirname, 'views'), {
  extension: 'html',
  map: { html: 'handlebars' }
}));

// Setup autorouter
app.use(autorouter({
  root: path.join(__dirname, 'views/'),
  ext: '.html'
}));

app.listen(3000);
```

## 📁 Directory Structure
```
views/
├── index.js              # GET /
├── index.html            # Template for /
├── user/
│   ├── profile.js        # GET /user/profile
│   ├── profile.html      # Template
│   └── settings.js       # GET /user/settings
├── admin/
│   ├── index.js          # GET /admin/
│   ├── help.html         # GET /admin/help (standalone view)
│   └── reports/
│       └── daily.js      # GET /admin/reports/daily
```

## 🎯 Controller Patterns

### Basic Controller
```js
// views/user/index.js
exports.index = async function(ctx, next) {
  ctx.state.users = await getUsers();
  await ctx.view(); // Renders user/index.html
};
```

### Full CRUD Controller
```js
// views/posts/index.js

// Optional middleware for all actions
exports.middleware = async function(ctx, next) {
  ctx.state.currentUser = await getCurrentUser(ctx);
  await next();
};

// GET /posts
exports.index = async function(ctx) {
  ctx.state.posts = await Post.findAll();
  await ctx.view();
};

// POST /posts
exports.create = async function(ctx) {
  const post = await Post.create(ctx.request.body);
  ctx.redirect(`/posts/${post.id}`);
};

// GET /posts/:id
exports.select = async function(ctx) {
  const id = ctx.state.id; // Auto-populated from URL
  ctx.state.post = await Post.findById(id);
  await ctx.view();
};

// POST /posts/:id
exports.update = async function(ctx) {
  const id = ctx.state.id;
  await Post.update(id, ctx.request.body);
  ctx.redirect(`/posts/${id}`);
};

// GET /posts/:id/edit
exports.edit = async function(ctx) {
  const id = ctx.state.id;
  ctx.state.post = await Post.findById(id);
  await ctx.view();
};

// POST /posts/:id/edit
exports.save = async function(ctx) {
  const id = ctx.state.id;
  await Post.update(id, ctx.request.body);
  ctx.redirect(`/posts/${id}`);
};

// GET /posts/:id/delete
exports.delete = async function(ctx) {
  const id = ctx.state.id;
  await Post.delete(id);
  ctx.redirect('/posts');
};
```

## ⚙️ Configuration Options

```js
app.use(autorouter({
  root: path.join(__dirname, 'views/'),  // Controllers directory
  ext: '.html',                          // Template extension
  enableStandalone: true                 // Enable views without controllers
}));
```

## 🔧 Template Engine Integration

### With Handlebars
```js
const views = require('koa-views');
app.use(views('views', { extension: 'hbs', map: { hbs: 'handlebars' } }));
```

### With Pug
```js
const views = require('koa-views');
app.use(views('views', { extension: 'pug' }));
```

### With EJS
```js
const views = require('koa-views');
app.use(views('views', { extension: 'ejs' }));
```

## 🛣️ Route Mapping

| File Path | URL | HTTP Method |
|-----------|-----|-------------|
| `views/index.js` → `exports.index` | `GET /` | GET |
| `views/user/profile.js` → `exports.index` | `GET /user/profile` | GET |
| `views/posts/index.js` → `exports.create` | `POST /posts` | POST |
| `views/posts/index.js` → `exports.select` | `GET /posts/:id` | GET |
| `views/admin/help.html` | `GET /admin/help` | GET (standalone) |

## 🧪 Testing

Run the example:
```bash
cd example
npm install
npm start
```

Visit:
- http://localhost:3000/ → `views/index.js`
- http://localhost:3000/admin → `views/admin/index.js`
- http://localhost:3000/admin/help → `views/admin/help.html` (standalone)
- http://localhost:3000/reports/help → `views/reports/help.js`

## 🔍 TypeScript Support

```typescript
import autorouter from 'koa-autorouter';
import { Context } from 'koa';

// Controller with types
export const index = async (ctx: Context) => {
  ctx.state.message = 'Hello TypeScript!';
  await ctx.view();
};
```

## 🆚 Comparison with Other Solutions

| Feature | koa-autorouter v2 | Next.js | Nuxt.js |
|---------|-------------------|---------|---------|
| Framework | Koa.js | React | Vue.js |
| File-based routing | ✅ | ✅ | ✅ |
| Server-side only | ✅ | ❌ | ❌ |
| Lightweight | ✅ | ❌ | ❌ |
| Template agnostic | ✅ | ❌ | ❌ |

## 🔄 Breaking Changes from v1.x

1. **Koa version**: Requires Koa v2+ (Node.js 14+)
2. **Function signatures**: `function*(ctx, next)` → `async function(ctx, next)`
3. **Context**: `this` → `ctx` parameter
4. **Async**: `yield` → `await`
5. **Dependencies**: Removed lodash, co-fs dependencies

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

---

**Upgrade your Koa routing to the modern era! 🚀**
