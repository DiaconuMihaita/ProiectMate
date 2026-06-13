declare module "react" {
  const React: any;
  export default React;
  export const StrictMode: any;
  export function useState<T = any>(initial?: T): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(value: T): { current: T };
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react-dom/client" {
  export function createRoot(container: any): { render(node: any): void };
}

declare module "react-router-dom" {
  export const BrowserRouter: any;
}

declare module "framer-motion" {
  export const motion: any;
}

declare module "socket.io-client" {
  export type Socket<TServer = any, TClient = any> = any;
  export function io(url: string, options?: any): Socket;
}

declare module "axios" {
  const axios: any;
  export default axios;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
