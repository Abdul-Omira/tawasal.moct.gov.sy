declare module 'hpp' {
  import { RequestHandler } from 'express';
  
  function hpp(options?: {
    whitelist?: string[];
    checkQuery?: boolean;
    checkBody?: boolean;
    checkParams?: boolean;
  }): RequestHandler;
  
  export = hpp;
}