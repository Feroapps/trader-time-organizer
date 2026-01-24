export interface AlertSound {
  id: string;
  name: string;
  description: string;
}

export const alertSounds: AlertSound[] = [
  {
    id: "chime",
    name: "Chime",
    description: "Gentle bell chime",
  },
  {
    id: "pulse",
    name: "Pulse",
    description: "Rhythmic pulse tone",
  },
  {
    id: "alert",
    name: "Alert",
    description: "Classic alert beep",
  },
  {
    id: "bell",
    name: "Bell",
    description: "Soft bell ring",
  },
  {
    id: "digital",
    name: "Digital",
    description: "Digital notification",
  },
];

export const DEFAULT_SOUND_ID = "chime";

let audioContext: AudioContext | null = null;
let isPlaying = false;
let oscillatorRef: OscillatorNode | null = null;
let gainRef: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function stopCurrentSound() {
  if (oscillatorRef) {
    try {
      oscillatorRef.stop();
      oscillatorRef.disconnect();
    } catch {
      // Already stopped
    }
    oscillatorRef = null;
  }
  if (gainRef) {
    gainRef.disconnect();
    gainRef = null;
  }
  isPlaying = false;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  attack = 0.01,
  decay = 0.1
): Promise<void> {
  return new Promise((resolve) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - decay);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillatorRef = oscillator;
    gainRef = gainNode;
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
      resolve();
    };
  });
}

export async function playSound(soundId: string, preview = false): Promise<void> {
  stopCurrentSound();
  isPlaying = true;
  
  const ctx = getAudioContext();
  await ctx.resume();
  
  const duration = preview ? 1.5 : 3;
  
  try {
    switch (soundId) {
      case "chime":
        await playTone(ctx, 880, 0.2, "sine");
        if (isPlaying) await playTone(ctx, 1320, 0.3, "sine");
        break;
        
      case "pulse":
        for (let i = 0; i < (preview ? 2 : 4); i++) {
          if (!isPlaying) break;
          await playTone(ctx, 440, 0.15, "square");
          await new Promise(r => setTimeout(r, 100));
        }
        break;
        
      case "alert":
        await playTone(ctx, 800, 0.2, "sawtooth");
        if (isPlaying) await playTone(ctx, 600, 0.2, "sawtooth");
        if (isPlaying) await playTone(ctx, 800, 0.3, "sawtooth");
        break;
        
      case "bell":
        await playTone(ctx, 659, 0.4, "sine");
        if (isPlaying) await playTone(ctx, 523, 0.5, "sine");
        break;
        
      case "digital":
        for (let i = 0; i < (preview ? 2 : 3); i++) {
          if (!isPlaying) break;
          await playTone(ctx, 1200, 0.1, "square");
          await new Promise(r => setTimeout(r, 50));
          await playTone(ctx, 1500, 0.1, "square");
          await new Promise(r => setTimeout(r, 150));
        }
        break;
        
      default:
        await playTone(ctx, 880, 0.3, "sine");
    }
  } finally {
    isPlaying = false;
  }
}

export function stopSound(): void {
  stopCurrentSound();
}

export function getSelectedSoundId(): string {
  return localStorage.getItem("selectedAlertSound") || DEFAULT_SOUND_ID;
}

export function setSelectedSoundId(soundId: string): void {
  localStorage.setItem("selectedAlertSound", soundId);
}
