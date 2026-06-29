/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Build hash nhúng lúc build (vite.config.ts `define`). Có thể undefined nếu chạy dev.
declare const __BUILD_HASH__: string;
