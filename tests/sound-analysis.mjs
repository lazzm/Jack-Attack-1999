// PCM diagnostics shared by the real-browser sound measurements.
export function wav(ch,sr){const n=ch[0].length,b=Buffer.alloc(44+n*8);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(3,20);b.writeUInt16LE(2,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*8,28);b.writeUInt16LE(8,32);b.writeUInt16LE(32,34);b.write('data',36);b.writeUInt32LE(n*8,40);for(let j=0;j<n;j++)for(let i=0;i<2;i++)b.writeFloatLE(ch[i][j],44+(j*2+i)*4);return b}
export function stats(ch,sampleRate){
 const db=x=>20*Math.log10(Math.max(1e-9,x));
 const rms=ch.map(a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length));
 // A real 2.5 kHz high-pass measurement, rather than just overall RMS:
 // the consonant band changes when the head faces away even for a bass voice.
 const w=2*Math.PI*2500/sampleRate,cs=Math.cos(w),alpha=Math.sin(w)/Math.SQRT2,a0=1+alpha;
 const b0=(1+cs)/2/a0,b1=-(1+cs)/a0,b2=b0,a1=-2*cs/a0,a2=(1-alpha)/a0;
 let peak=0,clip=0,high=0,energy=0,mono=0,band=0;
 for(let i=0;i<ch[0].length;i++)mono+=((ch[0][i]+ch[1][i])/2)**2;
 for(const a of ch){let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<a.length;i++){
  const x=a[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;
  peak=Math.max(peak,Math.abs(x));clip+=Math.abs(x)>=1;band+=y*y;energy+=x*x;if(i)high+=(x-a[i-1])**2;
 }}
 return{left:db(rms[0]),right:db(rms[1]),rms:db(Math.hypot(...rms)/Math.SQRT2),mono:db(Math.sqrt(mono/ch[0].length)),peak:db(peak),clip,brightness:10*Math.log10(high/energy),consonants:10*Math.log10(band/energy)};
}
