import fs from 'node:fs';
const KEY = fs.readFileSync(process.env.HOME + '/.secrets/gemini.env', 'utf8').match(/GEMINI_API_KEY=(\S+)/)[1];
for (const id of process.argv.slice(2)) {
  const data = fs.readFileSync(new URL('./out/' + id + '.mp3', import.meta.url)).toString('base64');
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: 'audio/mpeg', data } }, { text: 'Transcribe exactly every word spoken, nothing else. Then on a new line: ACCENT: <one phrase>' }] }] }) });
  const j = await r.json(); console.log(id, '=>', (j.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(j).slice(0, 200)).replace(/\n/g, ' | '));
}
