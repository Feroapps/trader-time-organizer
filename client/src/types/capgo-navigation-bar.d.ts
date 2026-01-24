declare module '@capgo/capacitor-navigation-bar' {
  export interface NavigationBarPlugin {
    setColor(options: { color: string; darkButtons?: boolean }): Promise<void>;
    getColor(): Promise<{ color: string }>;
    show(): Promise<void>;
    hide(): Promise<void>;
  }
  export const NavigationBar: NavigationBarPlugin;
}
