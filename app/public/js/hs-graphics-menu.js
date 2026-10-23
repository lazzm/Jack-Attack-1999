/* The pause menu's graphics page. Renderer state belongs to House; this page
 * only displays it and submits user choices through the public graphics API. */
(function () {
  'use strict';
  const names = { auto: 'Automatic', low: 'Performance', medium: 'Balanced', high: 'Quality', custom: 'Custom' };
  const help = {
    auto: 'Chooses a starting point for this device. Resolution can adjust as you play.',
    low: 'Favour smooth movement with lighter rendering. A useful starting point for slower devices.',
    medium: 'Balance picture detail and smooth movement.',
    high: 'Favour a sharper picture and more detail. Uses more graphics power.',
    custom: 'Your individual settings. Choosing another preset replaces these choices.'
  };
  function mount(dialog, actions) {
    const H = window.House, page = document.createElement('section');
    page.className = 'hs-graphics-menu'; page.id = 'hsGraphicsMenu'; page.hidden = true;
    page.setAttribute('aria-label', 'Graphics options');
    page.innerHTML = `<div class="hs-graphics-scroll" tabindex="0" aria-label="Scrollable graphics options">
      <p class="hs-graphics-intro">Changes apply immediately and are saved for next time.</p>
      <div class="hs-graphics-grid">
      <fieldset class="hs-graphics-preset"><legend>PICTURE PRESET</legend>
        <label for="hsGfxPreset">Preset</label><select id="hsGfxPreset" name="gfxPreset"><option value="auto">Automatic</option><option value="low">Performance</option><option value="medium">Balanced</option><option value="high">Quality</option><option value="custom" disabled>Custom</option></select>
        <p class="hs-graphics-preset-help"></p><p class="hs-graphics-custom-help">Adjust an option below to make a Custom preset.</p>
      </fieldset>
      <fieldset><legend>RESOLUTION</legend>
        <label for="hsGfxScale" class="hs-graphics-range-label">Maximum resolution <output for="hsGfxScale">100%</output></label>
        <input id="hsGfxScale" name="gfxScale" type="range" min="0.5" max="1" step="0.01" aria-describedby="hsGfxScaleHelp">
        <small id="hsGfxScaleHelp">Lower values draw a softer picture with less graphics work.</small>
        <label class="hs-graphics-check"><input type="checkbox" name="gfxDynamic"><span>Adjust resolution automatically<small>Allows a lower resolution when the scene is demanding. Your maximum stays as selected above.</small></span></label>
        <label for="hsGfxPixelRatio">Display detail</label><select id="hsGfxPixelRatio" name="gfxPixelRatio"><option value="1">1× — standard</option><option value="1.5">1.5×</option><option value="2">2× — sharp</option></select>
        <small>Higher detail can sharpen the picture on a dense display.</small>
      </fieldset>
      <fieldset><legend>EDGES &amp; TEXTURES</legend>
        <label for="hsGfxAA">Edge smoothing</label><select id="hsGfxAA" name="gfxAntialias"><option value="auto">Automatic</option><option value="off">Off</option><option value="on">On</option></select>
        <small>Anti-aliasing softens jagged edges. <span class="hs-graphics-aa-actual"></span></small>
        <label for="hsGfxFilter">Texture filtering</label><select id="hsGfxFilter" name="gfxAnisotropy"><option value="1">1×</option><option value="4">4×</option><option value="8">8×</option><option value="16">16×</option></select>
        <small>Keeps textures clearer at an angle. Higher values use more graphics power.</small>
      </fieldset>
      <fieldset class="hs-graphics-background"><legend>WHILE YOU ARE AWAY</legend>
        <label for="hsGfxBackground">Background screen refresh</label><select id="hsGfxBackground" name="gfxBackgroundFps"><option value="5">5 frames per second</option><option value="10">10 frames per second</option><option value="20">20 frames per second</option></select>
        <small>Controls background TV picture refresh. Simulation, messages and audio continue.</small>
        <label class="hs-graphics-check"><input type="checkbox" name="gfxDecorations"><span>Animate unattended screens<small>Keeps decorative screen effects moving while you are away. Messages and audio keep running either way.</small></span></label>
      </fieldset></div>
      <p class="hs-graphics-live" role="status" aria-live="polite"></p>
      <p class="hs-graphics-footnote">The active scale can change during demanding scenes when automatic resolution adjustment is enabled.</p>
      </div><div class="hs-graphics-footer"><button type="button" data-gfx="back">BACK TO MENU <kbd>Esc</kbd></button><button type="button" data-gfx="resume">RESUME GAME</button></div>`;
    dialog.appendChild(page);
    const field = name => page.querySelector('[name="gfx' + name + '"]');
    const live = page.querySelector('.hs-graphics-live');
    const controls = { Preset: 'preset', Scale: 'scale', Dynamic: 'dynamic', Antialias: 'antialias', PixelRatio: 'pixelRatio', Anisotropy: 'anisotropy', BackgroundFps: 'backgroundFps', Decorations: 'decorations' };
    let timer = null, error = '';
    const ready = () => typeof H?.graphicsGet === 'function' && typeof H?.graphicsSet === 'function';
    function sync() {
      if (page.hidden) return;
      let state;
      try { if (!ready()) throw Error(); state = H.graphicsGet(); if (!state) throw Error(); }
      catch (_) {
        page.querySelectorAll('input,select').forEach(el => { el.disabled = true; });
        live.textContent = 'Graphics options are unavailable. You can return to the menu or resume your game.';
        return;
      }
      for (const [suffix, property] of Object.entries(controls)) {
        const el = field(suffix), checkbox = el.type === 'checkbox';
        el.disabled = false;
        if (checkbox) el.checked = !!state[property];
        else if (el !== document.activeElement || suffix === 'Preset') el.value = String(state[property]);
      }
      field('Preset').querySelector('[value=custom]').disabled = state.preset !== 'custom';
      page.querySelector('output').textContent = Math.round(state.scale * 100) + '%';
      const tier = state.preset === 'auto' && names[state.tier] ? ' Device choice: ' + names[state.tier] + '.' : '';
      page.querySelector('.hs-graphics-preset-help').textContent = (help[state.preset] || help.custom) + tier;
      page.querySelector('.hs-graphics-custom-help').hidden = state.preset === 'custom';
      const actual = state.actualAntialias ? 'On' : 'Off';
      page.querySelector('.hs-graphics-aa-actual').textContent = 'Active: ' + actual + '.';
      const scale = Number.isFinite(state.actualScale) ? Math.round(state.actualScale * 100) + '%' : 'adjusting';
      const message = error || 'Active render scale: ' + scale + ' · Edge smoothing: ' + actual;
      if (live.textContent !== message) live.textContent = message;
    }
    function apply(el) {
      const suffix = el.name.slice(3), property = controls[suffix];
      if (!property || !ready() || property === 'preset' && el.value === 'custom') return;
      const value = el.type === 'checkbox' ? el.checked : ['scale', 'pixelRatio', 'anisotropy', 'backgroundFps'].includes(property) ? Number(el.value) : el.value;
      try { H.graphicsSet({ [property]: value }); error = ''; }
      catch (_) { error = 'This setting could not be applied. Please try again.'; }
      sync();
    }
    page.addEventListener('input', ev => { if (ev.target.name === 'gfxScale') apply(ev.target); });
    page.addEventListener('change', ev => { if (ev.target.name !== 'gfxScale') apply(ev.target); });
    page.addEventListener('click', ev => {
      const action = ev.target.closest('[data-gfx]')?.dataset.gfx;
      if (action === 'back') actions.back();
      else if (action === 'resume') actions.resume();
    });
    H?.on?.('graphics-options', sync);
    return {
      show() {
        error = ''; page.hidden = false; dialog.classList.add('hs-graphics-open');
        page.querySelector('.hs-graphics-scroll').scrollTop = 0;
        sync(); clearInterval(timer); timer = setInterval(sync, 750);
        (field('Preset').disabled ? page.querySelector('[data-gfx=back]') : field('Preset')).focus({ preventScroll: true });
      },
      hide() { clearInterval(timer); timer = null; page.hidden = true; dialog.classList.remove('hs-graphics-open'); },
      sync
    };
  }
  window.HouseGraphicsMenu = { mount, names };
})();
