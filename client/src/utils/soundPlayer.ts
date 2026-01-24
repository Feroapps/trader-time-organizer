import { playSound, stopSound, getSelectedSoundId } from './soundLibrary';

let stopTimeout: ReturnType<typeof setTimeout> | null = null;
let audioPreloaded = false;
let isCurrentlyPlaying = false;

export function preloadAudio(): void {
  if (audioPreloaded) return;
  audioPreloaded = true;
  console.log('[SoundPlayer] Audio preloaded (no playback)');
}

export function isAudioPreloaded(): boolean {
  return audioPreloaded;
}

export function playAlarm(durationSeconds: number): void {
  stopAlarm();
  
  const soundId = getSelectedSoundId();
  isCurrentlyPlaying = true;

  const playLoop = async () => {
    while (isCurrentlyPlaying) {
      await playSound(soundId, false);
      if (isCurrentlyPlaying) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  };
  
  playLoop();

  stopTimeout = setTimeout(() => {
    stopAlarm();
  }, durationSeconds * 1000);

  console.log(`[SoundPlayer] Playing alarm for ${durationSeconds} seconds`);
  console.log('ALARM_VOLUME_SOURCE: DEVICE_SYSTEM_VOLUME');
}

export function stopAlarm(): void {
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }

  isCurrentlyPlaying = false;
  stopSound();
  console.log('[SoundPlayer] Alarm stopped');
}

export function isPlaying(): boolean {
  return isCurrentlyPlaying;
}
