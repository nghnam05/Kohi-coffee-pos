/**
 * Professional Web Audio API Synthesizer for high-performance sound effects.
 * 100% offline-ready, zero-network load, immune to CDN blockages/CORS restrictions,
 * and bypasses standard autoplay locks on user interaction.
 */

// Safe helper to get a unified AudioContext across browsers
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

/**
 * Plays a clean, high-performance scanner beep sound.
 * (similar to professional Honeywell / Zebra commercial scanners)
 */
export const playScanBeep = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1050, ctx.currentTime); // Crisp high-frequency beep

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12); // Short 120ms duration

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    console.warn("Web Audio scan beep failed:", err);
  }
};

/**
 * Plays a beautiful double-bell cash register chime.
 * (Classic "Cha-ching!" sound for successful payments)
 */
export const playCashChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Helper to trigger a decaying sine bell chime
    const triggerBell = (delay: number, pitch: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);

      // Smooth attack and exponential decay
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Helper to trigger metallic clinks
    const triggerClink = (delay: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(3200, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.1);
    };

    // 1. Initial coins clinking together (metallic clinks)
    triggerClink(0.0, 0.12);
    triggerClink(0.04, 0.1);
    triggerClink(0.08, 0.08);

    // 2. Main Double Bell Chimes (Classic mechanical cashier sound)
    triggerBell(0.0, 1480, 0.45, 0.25);   // Lower bell strike
    triggerBell(0.11, 1780, 0.55, 0.22);  // Higher secondary strike
  } catch (err) {
    console.warn("Web Audio cash chime failed:", err);
  }
};

/**
 * Plays a standard clean alert notification sound.
 * (used for standard status updates like preparing, cooking, delivering)
 */
export const playAlertPing = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15); // rising sweep

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25); // 250ms duration

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.warn("Web Audio alert ping failed:", err);
  }
};

/**
 * Plays the iconic, bright digital notification chime of MoMo.
 * Warm, high-pitched two-tone digital bubble chime (perfect for Vietnamese users!)
 */
export const playMomoChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // A tone helper with clean sine wave + high harmonic layer for the rich bubble sound
    const playMomoTone = (delay: number, pitch: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);

      // Add a subtle pure high harmonic layer to give that warm, sweet brand chime feel
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(pitch * 2, ctx.currentTime + delay);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02); // warm soft attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

      // Lowpass filter to make it sound incredibly smooth and less harsh
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(pitch * 3, ctx.currentTime + delay);

      osc.connect(gainNode);
      harmonic.connect(gainNode);
      gainNode.connect(filter);
      filter.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      harmonic.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
      harmonic.stop(ctx.currentTime + delay + duration);
    };

    // MoMo's signature dual tone bubble chime
    // First high tone (E6 / ~1318.51Hz)
    playMomoTone(0.0, 1318.51, 0.35, 0.16);
    // Second rising tone (A6 / ~1760.00Hz) - delayed by 90ms for the quick double clink
    playMomoTone(0.09, 1760.00, 0.45, 0.14);

  } catch (err) {
    console.warn("Momo chime failed:", err);
  }
};

/**
 * Plays a warm, sparkling, luxurious welcome chime.
 * Rising major 9 arpeggio glissando using soft sine waves for a high-end experience.
 */
export const playWelcomeChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNote = (delay: number, pitch: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.04); // soft luxurious attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Warm rising C Major 9 chord arpeggio
    playNote(0.0, 523.25, 0.8, 0.12);   // C5
    playNote(0.07, 659.25, 0.8, 0.12);  // E5
    playNote(0.14, 783.99, 0.8, 0.12);  // G5
    playNote(0.21, 987.77, 0.8, 0.12);  // B5
    playNote(0.28, 1174.66, 1.0, 0.15); // D6 (Brilliant high chord peak)
  } catch (err) {
    console.warn("Welcome chime failed:", err);
  }
};
