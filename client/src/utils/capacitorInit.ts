import { Capacitor } from '@capacitor/core';

export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    
    const updateStatusBar = (isDark: boolean) => {
      if (isDark) {
        StatusBar.setBackgroundColor({ color: '#121212' });
        StatusBar.setStyle({ style: Style.Dark });
      } else {
        StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        StatusBar.setStyle({ style: Style.Light });
      }
    };

    const isDark = document.documentElement.classList.contains('dark');
    updateStatusBar(isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          updateStatusBar(isDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

  } catch (error) {
    console.warn('[Capacitor] Failed to initialize StatusBar:', error);
  }
}
