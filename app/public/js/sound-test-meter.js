/* Browser-test observer only; never loaded by the game. Silent PCM capture on the audio clock. */
class SoundTestMeter extends AudioWorkletProcessor {
  constructor() {
    super(); this.blocks = []; this.left = 0;
    this.port.onmessage = e => { if (e.data.frames) { this.blocks = []; this.left = e.data.frames; } };
  }
  process(inputs) {
    const channels = inputs[0];
    if (this.left && channels?.length) {
      const n = Math.min(this.left, channels[0].length);
      this.blocks.push([Array.from(channels[0].slice(0, n)), Array.from((channels[1] || channels[0]).slice(0, n))]);
      this.left -= n;
      if (!this.left) { this.port.postMessage(this.blocks); this.blocks = []; }
    }
    return true;
  }
}
registerProcessor('sound-meter', SoundTestMeter);
