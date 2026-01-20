let audioElement: HTMLAudioElement | null = null;
let stopTimeout: ReturnType<typeof setTimeout> | null = null;
let audioPreloaded = false;

// Preload audio file without playing - prepares for future playback
export function preloadAudio(): void {
  if (audioPreloaded) return;
  
  try {
    const audio = new Audio('/alarm.mp3');
    audio.preload = 'auto';
    audio.load();
    audioPreloaded = true;
    console.log('[SoundPlayer] Audio preloaded (no playback)');
  } catch (error) {
    console.warn('[SoundPlayer] Audio preload error:', error);
  }
}

export function isAudioPreloaded(): boolean {
  return audioPreloaded;
}

export function playAlarm(durationSeconds: number): void {
  stopAlarm();

  audioElement = new Audio('/alarm.mp3');
  audioElement.loop = true;

  audioElement.play().catch((error) => {
    console.warn('[SoundPlayer] Failed to play alarm:', error.message);
  });

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

  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement = null;
    console.log('[SoundPlayer] Alarm stopped');
  }
}

export function isPlaying(): boolean {
  return audioElement !== null && !audioElement.paused;
}
