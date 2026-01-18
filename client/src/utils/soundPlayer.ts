let audioElement: HTMLAudioElement | null = null;
let stopTimeout: ReturnType<typeof setTimeout> | null = null;
let audioUnlocked = false;

export function unlockAudio(): void {
  if (audioUnlocked) return;
  
  try {
    const audio = new Audio('/alarm.mp3');
    audio.volume = 0.001;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audioUnlocked = true;
      console.log('[SoundPlayer] Audio unlocked successfully');
    }).catch((error) => {
      console.warn('[SoundPlayer] Audio unlock failed:', error.message);
    });
  } catch (error) {
    console.warn('[SoundPlayer] Audio unlock error:', error);
  }
}

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
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
