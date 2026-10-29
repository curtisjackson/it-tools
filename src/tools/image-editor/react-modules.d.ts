// The image editor is a React component: the tool only creates its element and mounts it, and the
// fork has no React types (they would clash with Vue's JSX ones).
declare module 'react' {
  export function createElement(type: unknown, props?: Record<string, unknown>): unknown;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element): { render: (element: unknown) => void; unmount: () => void };
}
