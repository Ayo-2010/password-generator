const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const AMBIGUOUS = /[il1Lo0O]/g;

const passwordEl = document.getElementById('password');
const copyBtn = document.getElementById('copyBtn');
const refreshBtn = document.getElementById('refreshBtn');
const copiedMsg = document.getElementById('copiedMsg');
const strengthFill = document.getElementById('strengthFill');
const strengthText = document.getElementById('strengthText');
const crackTime = document.getElementById('crackTime');
const lengthRange = document.getElementById('lengthRange');
const lengthInput = document.getElementById('lengthInput');
const generateBtn = document.getElementById('generateBtn');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const clearHistory = document.getElementById('clearHistory');

const opts = {
  upper: document.getElementById('optUpper'),
  lower: document.getElementById('optLower'),
  numbers: document.getElementById('optNumbers'),
  symbols: document.getElementById('optSymbols'),
  noAmbig: document.getElementById('optNoAmbig'),
};

let history = [];

function randomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function buildPool() {
  let pool = '';
  Object.keys(SETS).forEach((key) => {
    if (opts[key].checked) pool += SETS[key];
  });
  if (opts.noAmbig.checked) pool = pool.replace(AMBIGUOUS, '');
  return pool;
}

function generate() {
  const pool = buildPool();
  const length = Number(lengthRange.value);

  if (!pool) {
    passwordEl.value = '';
    strengthText.textContent = 'No options';
    strengthFill.style.width = '0%';
    crackTime.textContent = 'Select at least one character type.';
    return '';
  }

  let result = '';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += pool[values[i] % pool.length];
  }

  passwordEl.value = result;
  updateStrength(result);
  return result;
}

function updateStrength(password) {
  if (!password) return;

  let poolSize = buildPool().length;
  const entropy = password.length * Math.log2(poolSize || 1);

  let level, label, color;
  if (entropy < 40) {
    level = 25; label = 'Weak'; color = '#ff5470';
  } else if (entropy < 60) {
    level = 50; label = 'Fair'; color = '#ffb020';
  } else if (entropy < 80) {
    level = 75; label = 'Strong'; color = '#46e3b0';
  } else {
    level = 100; label = 'Very strong'; color = '#3ddc97';
  }

  strengthFill.style.width = level + '%';
  strengthFill.style.background = color;
  strengthText.textContent = label;
  strengthText.style.color = color;

  crackTime.textContent = `~${describeCrackTime(entropy)} to crack by brute force.`;
}

function describeCrackTime(entropy) {
  const guessesPerSecond = 1e10;
  const seconds = Math.pow(2, entropy) / guessesPerSecond;

  const units = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 365],
    ['year', 1000],
  ];

  let value = seconds;
  let unit = 'second';
  for (const [name, factor] of units) {
    if (value < 60) { unit = name; break; }
    value /= 60;
    unit = name === 'second' ? 'minute' : name;
  }

  if (seconds < 1) return 'instantly';
  if (value >= 1e9) return 'billions of years';

  return `${Math.round(value)} ${unit}${Math.round(value) === 1 ? '' : 's'}`;
}

function addToHistory(password) {
  if (!password) return;
  history.unshift(password);
  if (history.length > 6) history.pop();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  historyEmpty.hidden = history.length !== 0;

  history.forEach((pw) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${pw}</span><small>tap to copy</small>`;
    li.addEventListener('click', () => copyText(pw, li.querySelector('small')));
    historyList.appendChild(li);
  });
}

function copyText(text, labelEl) {
  if (!text) return;

  const done = () => {
    if (labelEl) labelEl.textContent = 'copied!';
    copiedMsg.textContent = 'Copied to clipboard';
    copyBtn.classList.add('done');
    setTimeout(() => {
      copiedMsg.textContent = '';
      copyBtn.classList.remove('done');
      if (labelEl) labelEl.textContent = 'tap to copy';
    }, 1400);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  passwordEl.value = text;
  passwordEl.select();
  try {
    document.execCommand('copy');
    done();
  } catch (err) {
    copiedMsg.textContent = 'Press Ctrl+C to copy';
  }
}

function onGenerate() {
  addToHistory(generate());
}

generateBtn.addEventListener('click', onGenerate);
refreshBtn.addEventListener('click', onGenerate);

copyBtn.addEventListener('click', () => {
  copyText(passwordEl.value);
});

function syncLength(value) {
  let v = Math.min(64, Math.max(4, Number(value) || 4));
  lengthRange.value = v;
  lengthInput.value = v;
  lengthRange.style.setProperty('--p', ((v - 4) / 60) * 100 + '%');
  generate();
}

lengthRange.addEventListener('input', () => syncLength(lengthRange.value));
lengthInput.addEventListener('change', () => syncLength(lengthInput.value));

Object.values(opts).forEach((checkbox) => {
  checkbox.addEventListener('change', () => generate());
});

clearHistory.addEventListener('click', () => {
  history = [];
  renderHistory();
});

syncLength(16);
addToHistory(passwordEl.value);
renderHistory();
