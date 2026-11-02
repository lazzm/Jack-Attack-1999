// Optional diagnostic probe for tests/voices.mjs. Never loaded by the game itself.
// Audio-thread observations keep short names measurable when the render thread is busy.
class VoiceNameMeter extends AudioWorkletProcessor {
  constructor() {
    super(); this.timing = null; this.sent = {};
    this.port.onmessage = e => { this.timing = e.data; };
  }
  process(inputs) {
    const a = inputs[0]?.[0], o = this.timing;
    if (!o || !a?.length) return true;
    const t = currentFrame / sampleRate;
    if (t < o.t0) return true;
    const phase = t < o.t0 + o.nameDur ? 'name' : t >= o.t0 + o.nameDur + 0.1 ? 'line' : null;
    let sum = 0; for (const v of a) sum += v * v;
    const rms = Math.sqrt(sum / a.length);
    if (phase && rms > 0.003 && !this.sent[phase]) {
      this.sent[phase] = true; this.port.postMessage({ phase, t, rms });
    }
    return true; // Output stays silent; this is a parallel observer, not another voice output.
  }
}
registerProcessor('name-meter', VoiceNameMeter);
