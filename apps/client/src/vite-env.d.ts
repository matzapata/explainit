/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PUBLIC_API_URL?: string;
  readonly VITE_LAUNCHER_SRC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
