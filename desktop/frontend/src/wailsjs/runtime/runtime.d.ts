// Wails Runtime Type Definitions
export namespace runtime {
  export function LogPrint(message: string): void;
  export function LogInfo(message: string): void;
  export function LogWarning(message: string): void;
  export function LogError(message: string): void;
  export function LogFatal(message: string): void;
  export function LogDebug(message: string): void;
  export function EventsOn(eventName: string, callback: (...data: any) => void): () => void;
  export function EventsOnce(eventName: string, callback: (...data: any) => void): void;
  export function EventsOnMultiple(eventName: string, callback: (...data: any) => void, maxCallbacks: number): () => void;
  export function EventsEmit(eventName: string, ...data: any): void;
  export function EventsOff(eventName: string): void;
  export function WindowReload(): void;
  export function WindowSetTitle(title: string): void;
  export function WindowFullscreen(): void;
  export function WindowUnfullscreen(): void;
  export function WindowIsFullscreen(): Promise<boolean>;
  export function WindowSetSize(width: number, height: number): void;
  export function WindowGetSize(): Promise<{ w: number; h: number }>;
  export function WindowSetMaxSize(width: number, height: number): void;
  export function WindowSetMinSize(width: number, height: number): void;
  export function WindowSetPosition(x: number, y: number): void;
  export function WindowGetPosition(): Promise<{ x: number; y: number }>;
  export function WindowHide(): void;
  export function WindowShow(): void;
  export function WindowMaximise(): void;
  export function WindowUnmaximise(): void;
  export function WindowIsMaximised(): Promise<boolean>;
  export function WindowMinimise(): void;
  export function WindowUnminimise(): void;
  export function WindowCenter(): void;
  export function Quit(): void;
  export function Environment(): Promise<{ [key: string]: any }>;
  export function BrowserOpenURL(url: string): void;
}
