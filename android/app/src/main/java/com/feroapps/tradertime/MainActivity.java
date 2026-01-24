package com.feroapps.tradertime;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupEdgeToEdge();
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        setupEdgeToEdge();
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            setupEdgeToEdge();
        }
    }
    
    private void setupEdgeToEdge() {
        Window window = getWindow();
        
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        }
    }
}
