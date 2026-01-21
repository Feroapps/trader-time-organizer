type AdCallback = () => void;

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

export function showInterstitialAd(onComplete: AdCallback, onCancel?: AdCallback): void {
  if (!config.enabled) {
    onComplete();
    return;
  }

  console.info("[AdService] Showing interstitial ad...");
  
  setTimeout(() => {
    console.info("[AdService] Ad completed successfully");
    onComplete();
  }, 1500);
}

export function showRewardedAd(onComplete: AdCallback, onCancel?: AdCallback): void {
  if (!config.enabled) {
    onComplete();
    return;
  }

  console.info("[AdService] Showing rewarded ad...");
  
  setTimeout(() => {
    console.info("[AdService] Rewarded ad completed successfully");
    onComplete();
  }, 2000);
}
