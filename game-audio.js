/* Original short chiptune effects, synthesised locally with Web Audio. */
let gameAudio = null, gameSound = false;
let effectVariation = 0;
const GAME_EFFECTS = {
  coin: [[988,0,.055],[1976,.06,.13]],
  jump: [[180,0,.16,0,780]],
  powerup: [[392,0,.06],[523,.065,.06],[659,.13,.06],[784,.195,.06],[1047,.26,.13]],
  pipe: [[440,0,.07,0,220],[330,.08,.07,0,165],[220,.16,.09,0,110]],
  block: [[150,0,.045],[600,.04,.055]],
  star: [[784,0,.05],[988,.055,.05],[1175,.11,.05],[1568,.165,.1]],
  unlock: [[523,0,.055],[659,.06,.055],[784,.12,.12]],
  complete: [[523,0,.065],[659,.07,.065],[784,.14,.065],[1047,.22,.2]],
  reset: [[784,0,.06],[659,.07,.06],[523,.14,.09]],
  danger: [[392,0,.09,0,294],[294,.1,.09,0,196],[196,.2,.12]],
  select: [[660,0,.045],[880,.055,.075]]
};
function gameTone(notes) {
  if (!gameSound) return;
  try {
    if (!gameAudio) gameAudio = new (window.AudioContext || window.webkitAudioContext)();
    gameAudio.resume().then(() => {
      const base = gameAudio.currentTime;
      notes.forEach(([frequency,start,duration,wave = 0,endFrequency]) => {
        const oscillator = gameAudio.createOscillator(), gain = gameAudio.createGain();
        oscillator.type = wave ? 'triangle' : 'square';
        oscillator.frequency.setValueAtTime(frequency, base + start);
        if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, base + start + duration);
        gain.gain.setValueAtTime(0, base + start);
        gain.gain.linearRampToValueAtTime(.025, base + start + .006);
        gain.gain.exponentialRampToValueAtTime(.001, base + start + duration);
        oscillator.connect(gain); gain.connect(gameAudio.destination);
        oscillator.start(base + start); oscillator.stop(base + start + duration + .015);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    }).catch(() => {});
  } catch(error) { gameSound = false; updateSoundButton(); }
}
function playGameEffect(name, variation = 0) {
  const notes = GAME_EFFECTS[name] || GAME_EFFECTS.select;
  const pitch = Math.pow(2, variation / 12);
  gameTone(notes.map(([frequency,start,duration,wave,end]) => [frequency*pitch,start,duration,wave,end ? end*pitch : undefined]));
}
function gameButtonIdentity(button) {
  const action = button.getAttribute('onclick') || '';
  return button.id || [button.className, action, button.getAttribute('aria-label') || '', button.textContent.trim()].join('|');
}
function gameButtonEffect(button) {
  const value = gameButtonIdentity(button).toLowerCase();
  if (/padam|deletereport/.test(value)) return 'danger';
  if (/logout|keluar|close|tutup|cancel|batal/.test(value)) return 'pipe';
  if (/clear|reset|kosong/.test(value)) return 'reset';
  if (/submitbtn|simpan|bulk-generate|cetak|print/.test(value)) return 'powerup';
  if (/admin|login/.test(value)) return 'unlock';
  if (/install|pasang|updateapp/.test(value)) return 'star';
  if (/teacher-option|bulk-select/.test(value)) return 'coin';
  if (/tab-form/.test(value)) return 'jump';
  if (/tab-preview|card-open/.test(value)) return 'star';
  if (/tab-records|refresh|semula|fetchsavedrecords/.test(value)) return 'block';
  const variants = ['select','coin','jump','block','star','unlock'];
  let hash = 0; for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return variants[hash % variants.length];
}
function playGameButtonSound(button) {
  let hash = 0; for (const character of gameButtonIdentity(button)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  // A small pitch rotation makes repeated button presses varied too.
  playGameEffect(gameButtonEffect(button), (hash + effectVariation++ % 3) % 5 - 2);
}
function updateSoundButton() {
  const button = document.getElementById('sound-control');
  button.textContent = gameSound ? '🔊 Bunyi: Aktif' : '🔇 Bunyi: Tutup';
  button.setAttribute('aria-pressed', String(gameSound));
}
function startGame(sound) {
  gameSound = sound; document.getElementById('game-welcome').close(); updateSoundButton();
  if (sound) playGameEffect('complete');
}
function toggleGameSound() {
  gameSound = !gameSound; updateSoundButton(); if (gameSound) playGameEffect('coin');
}
document.addEventListener('click', event => {
  const button = event.target.closest('button, a[data-opr-pdf-link]');
  if (!button || button.disabled || button.closest('#game-welcome') || button.id === 'sound-control') return;
  playGameButtonSound(button);
}, true);
document.addEventListener('DOMContentLoaded', () => document.getElementById('game-welcome').showModal());
// Native selects and date pickers do not emit button clicks.
const OPR_FIELD_EFFECTS = {subjek:'star',kelas:'coin',tarikh:'jump',filterSubjek:'star',filterKelas:'coin'};
document.addEventListener('pointerdown', event => {
  const field = event.target.closest('select,input[type="date"]');
  if (field && !field.disabled && OPR_FIELD_EFFECTS[field.id]) playGameEffect('select',-2);
}, true);
document.addEventListener('change', event => {
  const field = event.target;
  if (OPR_FIELD_EFFECTS[field.id] && !field.disabled) playGameEffect(OPR_FIELD_EFFECTS[field.id]);
}, true);
document.addEventListener('keydown', event => {
  const field = event.target;
  if (OPR_FIELD_EFFECTS[field.id] && !field.disabled && ['Enter',' '].includes(event.key)) playGameEffect('select');
}, true);
