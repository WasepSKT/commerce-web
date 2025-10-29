// Shared type definitions for Cloudflare Turnstile
export type TurnstileWidgetSize = 'invisible' | 'normal' | 'compact' | 'flexible';

export interface TurnstileRenderOptions { 
  sitekey: string; 
  theme?: string; 
  size?: TurnstileWidgetSize; 
  callback?: (token: string) => void;
}

export interface TurnstileAPI {
  render: (el: HTMLElement, opts: TurnstileRenderOptions) => number | string | undefined;
  execute: (id: number | string) => void;
  reset: (id: number | string) => void;
  getResponse?: (id: number | string) => string | null;
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

