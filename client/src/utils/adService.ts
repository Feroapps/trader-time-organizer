import { Capacitor, registerPlugin } from "@capacitor/core";

interface RewardedAdsPlugin {
  load(options: { adUnitId: string }): Promise<void>;
  show(): Promise<{ rewarded: boolean }>;
}

const RewardedAds = registerPlugin<RewardedAdsPlugin>("RewardedAds");

const REWARDED_AD_UNIT_ID = "ca-app-pub-9912951398967782/8731525076";

interface AdConfig {
  enabled: boolean;
}

const config: AdConfig = {
  enabled: true,
};

export function setAdsEnabled(enabled: boolean): void {
  config.enabled = enabled;
}

export function areAdsEnabled(): boolean {
  return config.enabled;
}

export async function showRewardedAd(): Promise<boolean> {
  if (!config.enabled) {
    return true;
  }

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    try {
      console.info("[AdService] Loading rewarded ad on Android native...");
      await RewardedAds.load({ adUnitId: REWARDED_AD_UNIT_ID });
      console.info("[AdService] Showing rewarded ad...");
      const result = await RewardedAds.show();
      console.info("[AdService] Rewarded ad result:", result);
      return result.rewarded;
    } catch (error) {
      console.error("[AdService] Native rewarded ad error:", error);
      return false;
    }
  }

  console.info("[AdService] Showing rewarded ad (web fallback)...");
  return new Promise((resolve) => {
    setTimeout(() => {
      console.info("[AdService] Rewarded ad completed (web fallback)");
      resolve(true);
    }, 2000);
  });
}

export async function showInterstitialAd(): Promise<void> {
  if (!config.enabled) {
    return;
  }

  console.info("[AdService] Showing interstitial ad (stub)...");
  return new Promise((resolve) => {
    setTimeout(() => {
      console.info("[AdService] Interstitial ad completed");
      resolve();
    }, 1500);
  });
}
