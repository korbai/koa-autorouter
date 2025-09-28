import { Context, Middleware } from 'koa';

declare namespace KoaAutorouter {
  interface Settings {
    /** Root directory for controllers/views */
    root?: string;
    /** Template file extension (default: '.html') */
    ext?: string;
    /** Enable standalone views (default: true) */
    enableStandalone?: boolean;
  }

  interface Controller {
    /** Optional middleware to run before each action */
    middleware?: Middleware | Middleware[];
    /** GET / */
    index?: Middleware;
    /** POST / */
    create?: Middleware;
    /** GET /:id */
    select?: Middleware;
    /** POST /:id */
    update?: Middleware;
    /** GET /:id/edit */
    edit?: Middleware;
    /** POST /:id/edit */
    save?: Middleware;
    /** GET /:id/delete */
    delete?: Middleware;
    /** Custom render function */
    render?: Middleware;
  }

  interface ExtendedContext extends Context {
    /** Render view with optional data */
    view(viewName?: string, data?: any): Promise<any>;
    /** Merged request data (body + query + params) */
    data?: any;
  }
}

declare function createAutorouter(settings?: KoaAutorouter.Settings): Middleware;

export = createAutorouter;
export as namespace KoaAutorouter;