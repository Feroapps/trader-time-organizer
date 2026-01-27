import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { initializeNotifications, rescheduleAllAlarms } from '@/utils/nativeNotifications';

export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  console.log('[CapacitorInit] ===== APP COLD START =====');
  console.log('[CapacitorInit] Platform:', Capacitor.getPlatform());
  console.log('[CapacitorInit] Calling initializeNotifications...');
  
  await initializeNotifications();
  
  console.log('[CapacitorInit] initializeNotifications completed');

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { NavigationBar } = await import('@capgo/capacitor-navigation-bar');
    
    const updateSystemBars = async (isDark: boolean) => {
      const bgColor = isDark ? '#121212' : '#FFFFFF';
      const style = isDark ? Style.Dark : Style.Light;
      
      try {
        await StatusBar.setBackgroundColor({ color: bgColor });
        await StatusBar.setStyle({ style });
      } catch (e) {
        console.warn('[Capacitor] StatusBar update failed:', e);
      }
      
      try {
        await NavigationBar.setColor({ color: bgColor, darkButtons: !isDark });
      } catch (e) {
        console.warn('[Capacitor] NavigationBar update failed:', e);
      }
    };

    const applyCurrentTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      updateSystemBars(isDark);
    };

    applyCurrentTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          applyCurrentTheme();
          break;
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        applyCurrentTheme();
      }
    });

    App.addListener('appStateChange', (state: { isActive: boolean }) => {
      console.log('[CapacitorInit] appStateChange - isActive:', state.isActive);
      if (state.isActive) {
        applyCurrentTheme();
        console.log('[CapacitorInit] Calling rescheduleAllAlarms from appStateChange...');
        rescheduleAllAlarms();
      }
    });

    App.addListener('resume', () => {
      console.log('[CapacitorInit] resume event');
      applyCurrentTheme();
      console.log('[CapacitorInit] Calling rescheduleAllAlarms from resume...');
      rescheduleAllAlarms();
    });

    window.addEventListener('focus', () => {
      applyCurrentTheme();
    });

    window.addEventListener('pageshow', () => {
      applyCurrentTheme();
    });

  } catch (error) {
    console.warn('[Capacitor] Failed to initialize system bars:', error);
  }
}
