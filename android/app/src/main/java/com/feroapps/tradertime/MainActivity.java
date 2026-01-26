package com.feroapps.tradertime;

import com.getcapacitor.BridgeActivity;
import com.feroapps.tradertime.UserAlarmPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(UserAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
