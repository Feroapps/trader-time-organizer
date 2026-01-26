#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(ROOT, 'native/android-src/com/feroapps/tradertime');
const TARGET_DIR = path.join(ROOT, 'android/app/src/main/java/com/feroapps/tradertime');
const MANIFEST_PATH = path.join(ROOT, 'android/app/src/main/AndroidManifest.xml');
const MAIN_ACTIVITY_PATH = path.join(ROOT, 'android/app/src/main/java/com/feroapps/tradertime/MainActivity.java');

const JAVA_FILES = [
  'AlarmReceiver.java',
  'AlarmSoundService.java',
  'UserAlarmPlugin.java',
  'BootReceiver.java',
];

const REQUIRED_PERMISSIONS = [
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
];

const ALARM_RECEIVER_BLOCK = `
        <receiver
            android:name=".AlarmReceiver"
            android:exported="false" />`;

const ALARM_SERVICE_BLOCK = `
        <service
            android:name=".AlarmSoundService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />`;

const BOOT_RECEIVER_BLOCK = `
        <receiver
            android:name=".BootReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>`;

function log(msg) {
  console.log('[android-restore-native] ' + msg);
}

function error(msg) {
  console.error('[android-restore-native] ERROR: ' + msg);
  process.exit(1);
}

function verifySourceFiles() {
  for (const file of JAVA_FILES) {
    const filePath = path.join(SOURCE_DIR, file);
    if (!fs.existsSync(filePath)) {
      error('Source file missing: ' + filePath);
    }
  }
  log('All source files verified.');
}

function verifyAndroidExists() {
  if (!fs.existsSync(path.join(ROOT, 'android'))) {
    error('android/ folder does not exist. Run "npx cap add android" first.');
  }
  log('android/ folder exists.');
}

function ensureTargetDir() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    log('Created target directory: ' + TARGET_DIR);
  }
}

function copyJavaFiles() {
  for (const file of JAVA_FILES) {
    const src = path.join(SOURCE_DIR, file);
    const dest = path.join(TARGET_DIR, file);
    fs.copyFileSync(src, dest);
    log('Copied: ' + file);
  }
}

function patchManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    error('AndroidManifest.xml not found at: ' + MANIFEST_PATH);
  }

  let manifest = fs.readFileSync(MANIFEST_PATH, 'utf8');
  let changed = false;

  // Find the opening <manifest ...> tag
  const manifestTagMatch = manifest.match(/<manifest[^>]*>/);
  if (!manifestTagMatch) {
    error('Could not find <manifest> tag in AndroidManifest.xml');
  }

  const manifestTagEndIndex = manifest.indexOf(manifestTagMatch[0]) + manifestTagMatch[0].length;

  // Collect permissions that need to be added
  const permissionsToAdd = [];
  for (const perm of REQUIRED_PERMISSIONS) {
    if (!manifest.includes(`android:name="${perm}"`)) {
      permissionsToAdd.push('    <uses-permission android:name="' + perm + '" />');
      log('Will add permission: ' + perm);
      changed = true;
    }
  }

  // Insert permissions immediately after <manifest ...>
  if (permissionsToAdd.length > 0) {
    const permBlock = '\n' + permissionsToAdd.join('\n') + '\n';
    manifest = manifest.slice(0, manifestTagEndIndex) + permBlock + manifest.slice(manifestTagEndIndex);
  }

  // Add AlarmReceiver if missing
  if (!manifest.includes('android:name=".AlarmReceiver"')) {
    const appClosePos = manifest.lastIndexOf('</application>');
    if (appClosePos === -1) {
      error('Could not find </application> tag in AndroidManifest.xml');
    }
    manifest = manifest.slice(0, appClosePos) + ALARM_RECEIVER_BLOCK + '\n    ' + manifest.slice(appClosePos);
    log('Added AlarmReceiver to manifest.');
    changed = true;
  }

  // Add AlarmSoundService if missing
  if (!manifest.includes('android:name=".AlarmSoundService"')) {
    const appClosePos = manifest.lastIndexOf('</application>');
    if (appClosePos === -1) {
      error('Could not find </application> tag in AndroidManifest.xml');
    }
    manifest = manifest.slice(0, appClosePos) + ALARM_SERVICE_BLOCK + '\n    ' + manifest.slice(appClosePos);
    log('Added AlarmSoundService to manifest.');
    changed = true;
  }

  // Add BootReceiver if missing
  if (!manifest.includes('android:name=".BootReceiver"')) {
    const appClosePos = manifest.lastIndexOf('</application>');
    if (appClosePos === -1) {
      error('Could not find </application> tag in AndroidManifest.xml');
    }
    manifest = manifest.slice(0, appClosePos) + BOOT_RECEIVER_BLOCK + '\n    ' + manifest.slice(appClosePos);
    log('Added BootReceiver to manifest.');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(MANIFEST_PATH, manifest, 'utf8');
    log('AndroidManifest.xml patched.');
  } else {
    log('AndroidManifest.xml already has all required entries.');
  }
}

function patchMainActivity() {
  if (!fs.existsSync(MAIN_ACTIVITY_PATH)) {
    error('MainActivity.java not found at: ' + MAIN_ACTIVITY_PATH);
  }

  let content = fs.readFileSync(MAIN_ACTIVITY_PATH, 'utf8');
  const registerLine = 'registerPlugin(UserAlarmPlugin.class);';

  // Check if registerPlugin is already present
  if (content.includes(registerLine)) {
    log('MainActivity.java already has registerPlugin(UserAlarmPlugin.class).');
    return;
  }

  // Check if onCreate exists
  const onCreateMatch = content.match(/public\s+void\s+onCreate\s*\([^)]*\)\s*\{/);

  if (onCreateMatch) {
    // onCreate exists, find super.onCreate and insert after it
    const superOnCreateMatch = content.match(/super\.onCreate\([^)]*\);/);
    if (superOnCreateMatch) {
      const insertPos = content.indexOf(superOnCreateMatch[0]) + superOnCreateMatch[0].length;
      content = content.slice(0, insertPos) + '\n        ' + registerLine + content.slice(insertPos);
      log('Added registerPlugin(UserAlarmPlugin.class) after super.onCreate()');
    } else {
      error('onCreate exists but super.onCreate() not found');
    }
  } else {
    // Need to add onCreate method
    const classMatch = content.match(/class\s+MainActivity\s+extends\s+[^\{]+\{/);
    if (!classMatch) {
      error('Could not find MainActivity class declaration');
    }
    const classBodyStart = content.indexOf(classMatch[0]) + classMatch[0].length;

    const onCreateMethod = '\n\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        ' + registerLine + '\n    }\n';
    content = content.slice(0, classBodyStart) + onCreateMethod + content.slice(classBodyStart);
    log('Added onCreate method with registerPlugin to MainActivity.java');
  }

  fs.writeFileSync(MAIN_ACTIVITY_PATH, content, 'utf8');
  log('MainActivity.java patched.');
}

function main() {
  console.log('\n========================================');
  console.log('  Android Native Alarm Restore Script');
  console.log('========================================\n');

  verifySourceFiles();
  verifyAndroidExists();
  ensureTargetDir();
  copyJavaFiles();
  patchManifest();
  patchMainActivity();

  console.log('\n========================================');
  console.log('  Restore completed successfully!');
  console.log('========================================\n');
  console.log('Next steps:');
  console.log('  npx cap sync android');
  console.log('  npx cap open android\n');
}

main();
