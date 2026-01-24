import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.feroapps.tradertime",
  appName: "Trader Time Organizer",
  webDir: "dist/public",
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT",
      backgroundColor: "#FFFFFF",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: "ic_launcher",
      iconColor: "#0066FF",
      sound: "alert_01.wav",
    },
  },
};

export default config;
