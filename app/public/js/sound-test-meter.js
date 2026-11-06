/* Browser-test observer only; never loaded by the game. Silent PCM capture on the audio clock. */
class SoundTestMeter extends AudioWorkletProcessor {
  constructor() {
    super(); this.blocks = []; this.left = 0;
    this.port.onmessage = e => { if (e.data.frames) { this.blocks = []; this.left = e.data.frames; if(e.data.ready)this.port.postMessage({ready:true}); } };
  }
  process(inputs, outputs) {
    const channels = inputs[0];
    if (this.left) {
      const n = Math.min(this.left, channels?.[0]?.length || outputs?.[0]?.[0]?.length || 128);
      const left=channels?.[0],right=channels?.[1]||left;
      this.blocks.push([left?Array.from(left.slice(0,n)):new Array(n).fill(0),right?Array.from(right.slice(0,n)):new Array(n).fill(0)]);
      this.left -= n;
      if (!this.left) { this.port.postMessage(this.blocks); this.blocks = []; }
    }
    return true;
  }
}
registerProcessor('sound-meter', SoundTestMeter);
