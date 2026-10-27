/* Shared choices only. Selecting a style/tone never uploads or generates. */
(function () {
  'use strict';
  if (window.HSArtworkChoices) return;
  var KEY = 'hs-artwork-choices-v1';
  function read() {
    var value = null, legacy = {};
    try {
      value = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      legacy = JSON.parse(sessionStorage.getItem('hs3-gift') || '{}');
    } catch (e) { /* default selection is not a generated result */ }
    var recipes = window.HSArtworkEngine.recipes;
    return {version: 1,
      style: value && Object.hasOwn(recipes.styles, value.style) ? value.style : 'screenprint',
      tone: value && Object.hasOwn(recipes.tones, value.tone) ? value.tone : Object.hasOwn(recipes.tones, legacy.noteTone) ? legacy.noteTone : 'warm'};
  }
  function select(change) {
    var next = Object.assign(read(), change), recipes = window.HSArtworkEngine.recipes;
    if (!Object.hasOwn(recipes.styles, next.style) || !Object.hasOwn(recipes.tones, next.tone)) throw new Error('Unsupported artwork choice');
    // Fail visibly if storage cannot preserve shared choices; never silently reset per gift.
    sessionStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('hs-artwork-choices', {detail: next}));
    return next;
  }
  function mount(host, options) {
    if (!host || host.__hsArtChoices) return;
    host.__hsArtChoices = true;
    var recipes = window.HSArtworkEngine.recipes, choice = read();
    var label = document.createElement('label'); label.textContent = 'Artwork style';
    var picker = document.createElement('select'); picker.setAttribute('aria-label', 'Artwork style');
    Object.keys(recipes.styles).forEach(function (id) { var o = document.createElement('option'); o.value = id; o.textContent = recipes.styles[id].label; picker.appendChild(o); });
    picker.value = choice.style; label.appendChild(picker); host.appendChild(label);
    var tone = null;
    if (!options || !options.toneElsewhere) {
      var tl = document.createElement('label'); tl.textContent = 'Tone for your gifts';
      tone = document.createElement('select'); tone.setAttribute('aria-label', 'Tone for your gifts');
      Object.keys(recipes.tones).forEach(function (id) { var o = document.createElement('option'); o.value = id; o.textContent = recipes.tones[id].label; tone.appendChild(o); });
      tone.value = choice.tone; tl.appendChild(tone); host.appendChild(tl);
    }
    var status = document.createElement('p'); status.setAttribute('role', 'status');
    // 27 Oct ruling: tone sets the mood of the painting on every gift, and of the words
    // where a gift has them. A tone change after artwork exists needs a new version.
    var toneHelp = options && options.toneElsewhere ? 'Tone sets the mood of the painting on every gift and of the words on gifts that have them.' : options && options.wordFree ? 'Tone sets the mood of the painting. This gift has no words.' : 'Tone sets the mood of the painting and the words.';
    if (options && options.nativeUpload && !options.wordFree) toneHelp = 'Tone sets the mood of the painting and the words. Your note stays as written here. To rewrite it in a new tone, return to Buddy and choose Update note.';
    toneHelp += ' After you create artwork, changing the tone means making a new version.';
    var updateHelp = options && options.nativeUpload ? ' Create artwork with your photo below when these choices are ready.' : ' Artwork updates are paused while these styles are tested.';
    status.textContent = toneHelp + updateHelp;
    host.appendChild(status);
    function changed() {
      try { select({style: picker.value, tone: tone ? tone.value : read().tone}); status.textContent = toneHelp + ' Choices saved for all your gifts.' + (options && options.nativeUpload ? updateHelp : ' Your edited words stay as written.'); }
      catch (e) {
        var saved = read(); picker.value = saved.style; if (tone) tone.value = saved.tone;
        status.textContent = 'Your choices could not be saved. Your previous choices are still selected. Please try again.';
      }
    }
    picker.addEventListener('change', changed); if (tone) tone.addEventListener('change', changed);
  }
  window.HSArtworkChoices = {read: read, select: select, mount: mount,
    prepare: function(input) { var choice = read(); return window.HSArtworkEngine.prepare(Object.assign({}, input, {style: choice.style, tone: choice.tone})); }};
}());
