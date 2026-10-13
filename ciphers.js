const ALPHABETS = {
  uk: "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ",
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
};

function caesar(text, key, lang, decrypt = false) {
  const abc = ALPHABETS[lang];
  const n = abc.length;
  const shift = (((decrypt ? -key : key) % n) + n) % n;

  return [...text].map(ch => {
    const up = ch.toUpperCase();
    const i = abc.indexOf(up);
    if (i === -1) return ch;
    const r = abc[(i + shift) % n];
    return ch === up ? r : r.toLowerCase();
  }).join("");
}

function columnOrder(keyChars) {
  return keyChars
    .map((c, i) => ({ c: c.toLowerCase(), i }))
    .sort((a, b) => a.c.localeCompare(b.c, "uk") || a.i - b.i)
    .map(o => o.i);
}

function transposition(text, keyChars, decrypt = false) {
  const chars = [...text];
  const cols = keyChars.length;
  const n = chars.length;
  const order = columnOrder(keyChars);

  if (!decrypt) {
    const out = [];
    for (const col of order) {
      for (let r = col; r < n; r += cols) out.push(chars[r]);
    }
    return out.join("");
  }

  const plain = new Array(n);
  let pos = 0;
  for (const col of order) {
    for (let r = col; r < n; r += cols) plain[r] = chars[pos++];
  }
  return plain.join("");
}

module.exports = { ALPHABETS, caesar, transposition };