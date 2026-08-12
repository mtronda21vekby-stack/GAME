export class AudioController {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  async setEnabled(enabled: boolean) {
    if (!enabled) {
      this.stop();
      return;
    }
    if (this.context) return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    await context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 54;
    gain.gain.value = 0.012;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    this.context = context;
    this.oscillator = oscillator;
    this.gain = gain;
  }

  private stop() {
    try { this.oscillator?.stop(); } catch { /* already stopped */ }
    this.oscillator?.disconnect();
    this.gain?.disconnect();
    void this.context?.close();
    this.oscillator = null;
    this.gain = null;
    this.context = null;
  }

  dispose() { this.stop(); }
}
