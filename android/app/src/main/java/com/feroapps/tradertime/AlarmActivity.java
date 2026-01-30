package com.feroapps.tradertime;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class AlarmActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_alarm);

        String label = getIntent().getStringExtra(AlarmSoundService.EXTRA_ALARM_LABEL);
        if (label == null) label = "Alarm";

        TextView tv = findViewById(R.id.tvAlarmLabel);
        tv.setText(label);

        findViewById(R.id.btnStop).setOnClickListener(v -> {
            Intent i = new Intent(this, AlarmSoundService.class);
            i.setAction(AlarmSoundService.ACTION_STOP);
            startService(i);
            finish();
        });
    }
}
