export interface AlertSound {
  id: string;
  name: string;
  description: string;
  file: string;
}

export const alertSounds: AlertSound[] = [
  {
    id: "original",
    name: "Original",
    description: "Original app alert sound",
    file: "/alarm.mp3",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Standard notification tone",
    file: "/sounds/alert-01.wav",
  },
  {
    id: "chime",
    name: "Chime",
    description: "Extended melodic chime",
    file: "/sounds/alert-02.wav",
  },
  {
    id: "bell",
    name: "Bell",
    description: "Crisp bell sound",
    file: "/sounds/alert-03.wav",
  },
  {
    id: "ping",
    name: "Ping",
    description: "Quick ping notification",
    file: "/sounds/alert-04.wav",
  },
  {
    id: "tone",
    name: "Tone",
    description: "Classic alert tone",
    file: "/sounds/alert-05.wav",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Choose in Android notification settings",
    file: "",
  },
];

export const DEFAULT_SOUND_ID = "original";

const SOUND_STORAGE_KEY = "selectedAlertSound";

const LEGACY_SOUND_ID_MAP: Record<string, string> = {
  'alert-01': 'classic',
  'alert-02': 'chime',
  'alert-03': 'bell',
  'alert-04': 'ping',
  'alert-05': 'tone',
};

export function migrateSoundId(soundId: string | undefined): string {
  if (!soundId) return DEFAULT_SOUND_ID;
  if (LEGACY_SOUND_ID_MAP[soundId]) {
    return LEGACY_SOUND_ID_MAP[soundId];
  }
  return soundId;
}

let currentAudio: HTMLAudioElement | null = null;

export function getSoundById(id: string): AlertSound | undefined {
  const migratedId = migrateSoundId(id);
  return alertSounds.find((sound) => sound.id === migratedId);
}

export function getSelectedSoundId(): string {
  if (typeof localStorage === "undefined") return DEFAULT_SOUND_ID;
  const stored = localStorage.getItem(SOUND_STORAGE_KEY) || DEFAULT_SOUND_ID;
  return migrateSoundId(stored);
}

export function setSelectedSoundId(id: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SOUND_STORAGE_KEY, id);
}

export function playSound(soundId: string): Promise<void> {
  return new Promise((resolve) => {
    stopSound();
    
    if (soundId === 'custom') {
      resolve();
      return;
    }
    
    const sound = getSoundById(soundId);
    if (!sound || !sound.file) {
      resolve();
      return;
    }

    currentAudio = new Audio(sound.file);
    
    currentAudio.onended = () => {
      currentAudio = null;
      resolve();
    };
    
    currentAudio.onerror = () => {
      currentAudio = null;
      resolve();
    };

    currentAudio.play().catch((error) => {
      console.warn("Failed to play sound:", error);
      resolve();
    });
  });
}

export function previewSound(soundId: string): void {
  stopSound();
  
  if (soundId === 'custom') {
    return;
  }
  
  const sound = getSoundById(soundId);
  if (!sound || !sound.file) return;

  currentAudio = new Audio(sound.file);
  currentAudio.play().catch((error) => {
    console.warn("Failed to play sound preview:", error);
  });
}

export function stopSound(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export function playAlertSound(soundId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopSound();
    
    const sound = getSoundById(soundId);
    if (!sound) {
      resolve();
      return;
    }

    currentAudio = new Audio(sound.file);
    
    currentAudio.onended = () => {
      currentAudio = null;
      resolve();
    };
    
    currentAudio.onerror = () => {
      currentAudio = null;
      reject(new Error("Failed to play alert sound"));
    };

    currentAudio.play().catch((error) => {
      console.warn("Failed to play alert sound:", error);
      resolve();
    });
  });
}
