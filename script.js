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

function randomIndex(max) {
  const limit = Math.floor(4294967296 / max) * max;
  const array = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return value % max;
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
  for (let i = 0; i < length; i++) {
    result += pool[randomIndex(pool.length)];
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

  if (seconds < 1) return 'instantly';

  const steps = [
    { label: 'second', size: 1 },
    { label: 'minute', size: 60 },
    { label: 'hour', size: 3600 },
    { label: 'day', size: 86400 },
    { label: 'year', size: 31536000 },
  ];

  let chosen = steps[0];
  for (const step of steps) {
    if (seconds >= step.size) chosen = step;
  }

  const value = seconds / chosen.size;

  if (chosen.label === 'year' && value >= 1000) {
    if (value >= 1e15) return 'longer than the age of the universe';
    const units = [
      { label: 'thousand years', size: 1e3 },
      { label: 'million years', size: 1e6 },
      { label: 'billion years', size: 1e9 },
      { label: 'trillion years', size: 1e12 },
    ];
    let unit = units[0];
    for (const candidate of units) {
      if (value >= candidate.size) unit = candidate;
    }
    return `${Math.round(value / unit.size).toLocaleString('en-US')} ${unit.label}`;
  }

  const rounded = Math.round(value);
  return `${rounded.toLocaleString('en-US')} ${chosen.label}${rounded === 1 ? '' : 's'}`;
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
    const span = document.createElement('span');
    span.textContent = pw;
    const hint = document.createElement('small');
    hint.textContent = 'tap to copy';
    li.append(span, hint);
    li.addEventListener('click', () => copyText(pw, hint));
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
