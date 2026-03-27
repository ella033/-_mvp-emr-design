declare module 'pagedjs' {
  export class Previewer {
    constructor();
    preview(
      content: string | HTMLElement,
      options?: unknown[],
      container?: HTMLElement
    ): Promise<void>;
  }

  export class Handler {
    constructor(chunker: unknown, polisher: unknown, caller: unknown);
    afterPageLayout?(
      pageElement: HTMLElement,
      page: unknown,
      breakToken: unknown,
      chunker: unknown
    ): void;
    layout?(rendered: HTMLElement, layout: unknown): void;
  }

  export function registerHandlers(...handlers: typeof Handler[]): void;

  const pagedjs: {
    Previewer: typeof Previewer;
    Handler: typeof Handler;
    registerHandlers: typeof registerHandlers;
  };

  export default pagedjs;
}

