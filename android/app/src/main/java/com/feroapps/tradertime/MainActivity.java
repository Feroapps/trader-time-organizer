package com.feroapps.tradertime;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    Log.i("MainActivity", "MainActivity.onCreate - registering UserAlarmPlugin");
    registerPlugin(UserAlarmPlugin.class);
  }
}
