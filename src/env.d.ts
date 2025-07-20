/// <reference path="../.astro/types.d.ts" />

declare global {
  interface Window {
    editorManager: {
      open: (filePath: string) => Promise<void>;
    };
  }
}