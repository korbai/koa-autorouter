const request = require('supertest');
const Koa = require('koa');
const path = require('path');
const fs = require('fs').promises;
const autorouter = require('../index');

describe('Koa Autorouter v2', () => {
  let app;
  let testDir;

  beforeEach(async () => {
    app = new Koa();
    testDir = path.join(__dirname, 'fixtures');
    
    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'admin'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'posts'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Routing', () => {
    test('should register index route', async () => {
      // Create test controller
      await fs.writeFile(path.join(testDir, 'index.js'), `
        exports.index = async function(ctx) {
          ctx.body = { message: 'Hello from index' };
        };
      `);

      app.use(autorouter({ root: testDir }));

      const response = await request(app.callback())
        .get('/')
        .expect(200);

      expect(response.body.message).toBe('Hello from index');
    });

    test('should register nested routes', async () => {
      // Create nested controller
      await fs.writeFile(path.join(testDir, 'admin', 'index.js'), `
        exports.index = async function(ctx) {
          ctx.body = { message: 'Admin panel' };
        };
      `);

      app.use(autorouter({ root: testDir }));

      const response = await request(app.callback())
        .get('/admin')
        .expect(200);

      expect(response.body.message).toBe('Admin panel');
    });

    test('should register named controllers', async () => {
      // Create named controller
      await fs.writeFile(path.join(testDir, 'posts', 'create.js'), `
        exports.index = async function(ctx) {
          ctx.body = { message: 'Create post page' };
        };
      `);

      app.use(autorouter({ root: testDir }));

      const response = await request(app.callback())
        .get('/posts/create')
        .expect(200);

      expect(response.body.message).toBe('Create post page');
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      // Create CRUD controller
      await fs.writeFile(path.join(testDir, 'posts', 'index.js'), `
        exports.index = async function(ctx) {
          ctx.body = { action: 'index', method: ctx.method };
        };

        exports.create = async function(ctx) {
          ctx.body = { action: 'create', method: ctx.method };
        };

        exports.select = async function(ctx) {
          ctx.body = { 
            action: 'select', 
            method: ctx.method,
            id: ctx.state.id 
          };
        };

        exports.update = async function(ctx) {
          ctx.body = { 
            action: 'update', 
            method: ctx.method,
            id: ctx.state.id 
          };
        };

        exports.edit = async function(ctx) {
          ctx.body = { 
            action: 'edit', 
            method: ctx.method,
            id: ctx.state.id 
          };
        };

        exports.save = async function(ctx) {
          ctx.body = { 
            action: 'save', 
            method: ctx.method,
            id: ctx.state.id 
          };
        };

        exports.delete = async function(ctx) {
          ctx.body = { 
            action: 'delete', 
            method: ctx.method,
            id: ctx.state.id 
          };
        };
      `);

      app.use(autorouter({ root: testDir }));
    });

    test('GET /posts should call index action', async () => {
      const response = await request(app.callback())
        .get('/posts')
        .expect(200);

      expect(response.body).toEqual({
        action: 'index',
        method: 'GET'
      });
    });

    test('POST /posts should call create action', async () => {
      const response = await request(app.callback())
        .post('/posts')
        .expect(200);

      expect(response.body).toEqual({
        action: 'create',
        method: 'POST'
      });
    });

    test('GET /posts/:id should call select action', async () => {
      const response = await request(app.callback())
        .get('/posts/123')
        .expect(200);

      expect(response.body).toEqual({
        action: 'select',
        method: 'GET',
        id: '123'
      });
    });

    test('POST /posts/:id should call update action', async () => {
      const response = await request(app.callback())
        .post('/posts/456')
        .expect(200);

      expect(response.body).toEqual({
        action: 'update',
        method: 'POST',
        id: '456'
      });
    });

    test('GET /posts/:id/edit should call edit action', async () => {
      const response = await request(app.callback())
        .get('/posts/789/edit')
        .expect(200);

      expect(response.body).toEqual({
        action: 'edit',
        method: 'GET',
        id: '789'
      });
    });

    test('POST /posts/:id/edit should call save action', async () => {
      const response = await request(app.callback())
        .post('/posts/101/edit')
        .expect(200);

      expect(response.body).toEqual({
        action: 'save',
        method: 'POST',
        id: '101'
      });
    });

    test('GET /posts/:id/delete should call delete action', async () => {
      const response = await request(app.callback())
        .get('/posts/202/delete')
        .expect(200);

      expect(response.body).toEqual({
        action: 'delete',
        method: 'GET',
        id: '202'
      });
    });
  });

  describe('Middleware Support', () => {
    test('should execute controller middleware', async () => {
      await fs.writeFile(path.join(testDir, 'index.js'), `
        exports.middleware = async function(ctx, next) {
          ctx.state.middlewareExecuted = true;
          await next();
        };

        exports.index = async function(ctx) {
          ctx.body = { 
            message: 'Hello',
            middlewareExecuted: ctx.state.middlewareExecuted 
          };
        };
      `);

      app.use(autorouter({ root: testDir }));

      const response = await request(app.callback())
        .get('/')
        .expect(200);

      expect(response.body.middlewareExecuted).toBe(true);
    });

    test('should support multiple middlewares', async () => {
      await fs.writeFile(path.join(testDir, 'index.js'), `
        const middleware1 = async (ctx, next) => {
          ctx.state.step1 = true;
          await next();
        };

        const middleware2 = async (ctx, next) => {
          ctx.state.step2 = true;
          await next();
        };

        exports.middleware = [middleware1, middleware2];

        exports.index = async function(ctx) {
          ctx.body = { 
            step1: ctx.state.step1,
            step2: ctx.state.step2
          };
        };
      `);

      app.use(autorouter({ root: testDir }));

      const response = await request(app.callback())
        .get('/')
        .expect(200);

      expect(response.body.step1).toBe(true);
      expect(response.body.step2).toBe(true);
    });
  });

  describe('View Integration', () => {
    test('should add view method to context', async () => {
      // Mock render function
      app.use(async (ctx, next) => {
        ctx.render = async (viewName, data) => {
          ctx.body = { viewName, data };
        };
        await next();
      });

      await fs.writeFile(path.join(testDir, 'index.js'), `
        exports.index = async function(ctx) {
          await ctx.view('test-view', { message: 'Hello View' });
        };
      `);

      app.use(autorouter({ root: testDir }));

      const response = await request(app.callback())
        .get('/')
        .expect(200);

      expect(response.body.viewName).toBe('test-view');
      expect(response.body.data.message).toBe('Hello View');
    });
  });

  describe('Error Handling', () => {
    test('should handle controller errors gracefully', async () => {
      await fs.writeFile(path.join(testDir, 'index.js'), `
        exports.index = async function(ctx) {
          throw new Error('Controller error');
        };
      `);

      app.use(async (ctx, next) => {
        try {
          await next();
        } catch (err) {
          ctx.status = 500;
          ctx.body = { error: err.message };
        }
      });

      app.use(autorouter({ root: testDir }));

      const response = await request(app.callback())
        .get('/')
        .expect(500);

      expect(response.body.error).toBe('Controller error');
    });
  });
});