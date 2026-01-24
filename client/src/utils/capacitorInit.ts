import { Capacitor } from '@capacitor/core';

export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { NavigationBar } = await import('@capgo/capacitor-navigation-bar');
    
    const updateSystemBars = async (isDark: boolean) => {
      const bgColor = isDark ? '#121212' : '#FFFFFF';
      const style = isDark ? Style.Dark : Style.Light;
      
      await StatusBar.setBackgroundColor({ color: bgColor });
      await StatusBar.setStyle({ style });
      await StatusBar.setOverlaysWebView({ overlay: true });
      
      await NavigationBar.setColor({ color: bgColor, darkButtons: !isDark });
    };

    const isDark = document.documentElement.classList.contains('dark');
    await updateSystemBars(isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          updateSystemBars(isDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const isDark = document.documentElement.classList.contains('dark');
        updateSystemBars(isDark);
      }
    });

  } catch (error) {
    console.warn('[Capacitor] Failed to initialize system bars:', error);
  }
}
