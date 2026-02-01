package com.feroapps.tradertime;

import android.app.Activity;
import android.util.Log;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

@CapacitorPlugin(name = "RewardedAds")
public class RewardedAdsPlugin extends Plugin {
    private static final String TAG = "RewardedAdsPlugin";
    private RewardedAd rewardedAd = null;
    private boolean isInitialized = false;
    private String loadedAdUnitId = null;
    private PluginCall pendingShowCall = null;
    private boolean userEarnedReward = false;

    @Override
    public void load() {
        super.load();
        initializeMobileAds();
    }

    private void initializeMobileAds() {
        if (isInitialized) return;
        
        Activity activity = getActivity();
        if (activity == null) return;

        activity.runOnUiThread(() -> {
            MobileAds.initialize(activity, initializationStatus -> {
                isInitialized = true;
                Log.d(TAG, "MobileAds initialized");
            });
        });
    }

    @PluginMethod
    public void load(PluginCall call) {
        String adUnitId = call.getString("adUnitId");
        if (adUnitId == null || adUnitId.isEmpty()) {
            call.reject("adUnitId is required");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            AdRequest adRequest = new AdRequest.Builder().build();
            
            RewardedAd.load(activity, adUnitId, adRequest, new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull RewardedAd ad) {
                    rewardedAd = ad;
                    loadedAdUnitId = adUnitId;
                    Log.d(TAG, "Rewarded ad loaded");
                    call.resolve();
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    rewardedAd = null;
                    loadedAdUnitId = null;
                    Log.e(TAG, "Failed to load rewarded ad: " + loadAdError.getMessage());
                    call.reject("Failed to load ad: " + loadAdError.getMessage());
                }
            });
        });
    }

    @PluginMethod
    public void show(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        if (rewardedAd == null) {
            call.reject("No ad loaded. Call load() first.");
            return;
        }

        pendingShowCall = call;
        userEarnedReward = false;

        activity.runOnUiThread(() -> {
            rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    Log.d(TAG, "Ad dismissed, rewarded: " + userEarnedReward);
                    rewardedAd = null;
                    loadedAdUnitId = null;
                    
                    if (pendingShowCall != null) {
                        JSObject result = new JSObject();
                        result.put("rewarded", userEarnedReward);
                        pendingShowCall.resolve(result);
                        pendingShowCall = null;
                    }
                }

                @Override
                public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                    Log.e(TAG, "Ad failed to show: " + adError.getMessage());
                    rewardedAd = null;
                    loadedAdUnitId = null;
                    
                    if (pendingShowCall != null) {
                        pendingShowCall.reject("Failed to show ad: " + adError.getMessage());
                        pendingShowCall = null;
                    }
                }

                @Override
                public void onAdShowedFullScreenContent() {
                    Log.d(TAG, "Ad showed fullscreen content");
                }
            });

            rewardedAd.show(activity, rewardItem -> {
                Log.d(TAG, "User earned reward: " + rewardItem.getAmount() + " " + rewardItem.getType());
                userEarnedReward = true;
            });
        });
    }
}
