package com.feroapps.tradertime;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    registerPlugin(UserAlarmPlugin.class);
    super.onCreate(savedInstanceState);
    FixedSessionScheduler.scheduleAllEnabledFixedSessions(this);
  }
}
