'use strict';

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const compose = require('koa-compose');
const Router = require('koa-router');
const debug = require('debug')('autorouter');

/**
 * Modern Koa autorouter middleware with async/await support
 * @param {Object} settings - Configuration options
 * @param {string} settings.root - Root directory for controllers/views
 * @param {string} settings.ext - Template file extension (default: '.html')
 * @param {boolean} settings.enableStandalone - Enable standalone views (default: true)
 * @returns {Function} Composed middleware
 */
module.exports = function createAutorouter(settings = {}) {
  settings = {
    root: settings.root || process.cwd(),
    ext: settings.ext || '.html',
    enableStandalone: settings.enableStandalone !== false,
    ...settings
  };

  const views = new Map();
  const router = new Router();

  debug('registering controllers and views at', settings.root);
  
  // Register routes synchronously during startup
  registerRoutes(settings.root, router, views, settings);

  const middlewares = [
    autoviewer(views, settings),
    router.routes(),
    router.allowedMethods()
  ];

  if (settings.enableStandalone) {
    middlewares.push(standaloneViews(settings));
  }

  return compose(middlewares);
};

/**
 * Middleware that adds view() method to context
 */
function autoviewer(views, settings) {
  return async (ctx, next) => {
    ctx.view = async function(viewName, data = {}) {
      const url = ctx.request.path;
      let view = viewName || views.get(url);
      
      // Fallback logic for dynamic routes
      if (!view) {
        let fallbackUrl = url;
        while (!view && fallbackUrl.length > 0) {
          debug('view fallback for', fallbackUrl);
          
          // Remove trailing slash
          if (fallbackUrl.endsWith('/') && fallbackUrl.length > 1) {
            fallbackUrl = fallbackUrl.slice(0, -1);
          }
          
          const lastSlash = fallbackUrl.lastIndexOf('/');
          if (lastSlash === -1) break;
          
          fallbackUrl = fallbackUrl.substring(0, lastSlash);
          view = views.get(fallbackUrl);
        }
      }

      if (!view) {
        throw new Error(`View not found for path: ${url}`);
      }

      debug(url, '-> view', view + settings.ext);
      
      // Merge data with existing state
      Object.assign(ctx.state, data);
      
      // Call render method if available (from template engine middleware)
      if (ctx.render) {
        return await ctx.render(view, ctx.state);
      } else {
        throw new Error('No render method available. Please add a template engine middleware.');
      }
    };
    
    await next();
  };
}

/**
 * Middleware for standalone views (templates without controllers)
 */
function standaloneViews(settings) {
  return async (ctx, next) => {
    const url = ctx.request.path;
    const absPath = path.join(settings.root, url);
    
    try {
      // Check if file exists with extension
      if (url.endsWith(settings.ext)) {
        await fs.access(absPath);
        debug('standalone with ext', url);
        const viewName = url.substring(0, url.length - settings.ext.length);
        return await ctx.render(viewName);
      }
      
      // Check if file exists without extension
      const absPathWithExt = absPath + settings.ext;
      await fs.access(absPathWithExt);
      debug('standalone', url + settings.ext);
      return await ctx.render(url);
      
    } catch (err) {
      // File doesn't exist, continue to next middleware
      await next();
    }
  };
}

/**
 * Copy route parameter to state for convenience
 */
function copyIdToState() {
  return async (ctx, next) => {
    if (ctx.params.id) {
      ctx.state.id = ctx.params.id;
    }
    await next();
  };
}

/**
 * Register routes based on file system structure
 */
function registerRoutes(root, router, views, settings, relativePath = '') {
  const currentDir = path.join(root, relativePath);
  
  if (!fsSync.existsSync(currentDir)) {
    debug('Directory does not exist:', currentDir);
    return;
  }

  const items = [];
  
  try {
    const dirContents = fsSync.readdirSync(currentDir);
    
    dirContents.forEach(item => {
      const absPath = path.join(currentDir, item);
      const stat = fsSync.statSync(absPath);
      
      let type = -1; // unknown
      if (stat.isDirectory()) {
        type = 0; // directory
      } else if (item === 'index.js') {
        type = 2; // index controller
      } else if (item.endsWith('.js') && !item.endsWith(settings.ext + '.js')) {
        type = 1; // regular controller
      }
      
      if (type >= 0) {
        items.push({ name: item, type, absPath });
      }
    });

    // Sort by type (directories first, then controllers)
    items.sort((a, b) => a.type - b.type);

    items.forEach(({ name, type, absPath }) => {
      if (type === 0) {
        // Directory - recurse
        registerRoutes(root, router, views, settings, path.join(relativePath, name));
      } else {
        // Controller file
        registerController(absPath, relativePath, name, router, views, settings);
      }
    });
    
  } catch (err) {
    debug('Error reading directory:', currentDir, err.message);
  }
}

/**
 * Register a single controller file
 */
function registerController(absPath, relativePath, fileName, router, views, settings) {
  try {
    // Clear require cache for development
    delete require.cache[require.resolve(absPath)];
    const controller = require(absPath);
    
    let route = '/' + relativePath.replace(/\\/g, '/');
    let viewPath = route;
    
    if (fileName === 'index.js') {
      if (viewPath !== '/') {
        viewPath += '/';
      }
      viewPath += 'index';
    } else {
      const baseName = fileName.slice(0, -3); // remove .js
      if (route !== '/') route += '/';
      route += baseName;
      viewPath = route;
    }

    // Find corresponding view file
    let finalViewPath = viewPath;
    
    while (finalViewPath.length > 0) {
      const testPath = path.join(settings.root, finalViewPath + settings.ext);
      if (fsSync.existsSync(testPath)) {
        break;
      }
      
      const indexSuffix = finalViewPath.endsWith('/index') ? '' : '/index';
      const parentPath = finalViewPath.substring(0, finalViewPath.lastIndexOf('/')) + indexSuffix;
      
      if (parentPath === finalViewPath) break;
      finalViewPath = parentPath;
    }

    views.set(route, finalViewPath);
    debug(`${route} -> ${finalViewPath}${settings.ext}`);

    // Extract middleware
    let middlewares = controller.middleware || [];
    if (!Array.isArray(middlewares)) {
      middlewares = [middlewares];
    }

    // Register route handlers
    const routeActions = {
      index: { method: 'get', path: route },
      create: { method: 'post', path: route },
      select: { method: 'get', path: route + '/:id', useId: true },
      update: { method: 'post', path: route + '/:id', useId: true },
      edit: { method: 'get', path: route + '/:id/edit', useId: true },
      save: { method: 'post', path: route + '/:id/edit', useId: true },
      delete: { method: 'get', path: route + '/:id/delete', useId: true }
    };

    Object.entries(routeActions).forEach(([actionName, config]) => {
      const handler = controller[actionName];
      if (typeof handler === 'function') {
        const routeMiddlewares = [...middlewares];
        if (config.useId) {
          routeMiddlewares.unshift(copyIdToState());
        }
        routeMiddlewares.push(handler);
        
        router[config.method](config.path, ...routeMiddlewares);
        debug(`Registered ${config.method.toUpperCase()} ${config.path}`);
      }
    });

  } catch (err) {
    debug('Error loading controller:', absPath, err.message);
  }
}