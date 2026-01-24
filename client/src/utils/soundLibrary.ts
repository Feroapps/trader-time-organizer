export interface AlertSound {
  id: string;
  name: string;
  description: string;
  file: string;
}

export const alertSounds: AlertSound[] = [
  {
    id: "alert-01",
    name: "Default",
    description: "Standard notification tone",
    file: "/sounds/alert-01.wav",
  },
  {
    id: "alert-02",
    name: "Chime",
    description: "Extended melodic chime",
    file: "/sounds/alert-02.wav",
  },
  {
    id: "alert-03",
    name: "Bell",
    description: "Crisp bell sound",
    file: "/sounds/alert-03.wav",
  },
  {
    id: "alert-04",
    name: "Ping",
    description: "Quick ping notification",
    file: "/sounds/alert-04.wav",
  },
  {
    id: "alert-05",
    name: "Tone",
    description: "Classic alert tone",
    file: "/sounds/alert-05.wav",
  },
];

export const DEFAULT_SOUND_ID = "alert-01";

const SOUND_STORAGE_KEY = "selectedAlertSound";

let currentAudio: HTMLAudioElement | null = null;

export function getSoundById(id: string): AlertSound | undefined {
  return alertSounds.find((sound) => sound.id === id);
}

export function getSelectedSoundId(): string {
  if (typeof localStorage === "undefined") return DEFAULT_SOUND_ID;
  return localStorage.getItem(SOUND_STORAGE_KEY) || DEFAULT_SOUND_ID;
}

export function setSelectedSoundId(id: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SOUND_STORAGE_KEY, id);
}

export function playSound(soundId: string): Promise<void> {
  return new Promise((resolve) => {
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
  
  const sound = getSoundById(soundId);
  if (!sound) return;

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
