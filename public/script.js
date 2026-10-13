/* ============ Дані та стан ============ */
const $ = id => document.getElementById(id);

const ALPHABETS = {
  uk: "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ",
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
};
// найуживаніші літери мови; перша — найчастіша (О / E)
const COMMON = { uk: "ОАНІИВТЕРС", en: "ETAOINSHRD" };

const SAMPLES = {
  caesar: "Шукаємо щастя по країнах",
  trans: "Прикладна математика",
  combo: "Привіт, світе! Це лабораторна робота",
  analysis: "ДАФИНЦШЕИЮЯЗЩШФЬИТЧИВЮЯШХСЯЯЗВИЇШЧШЮФЬСПЄСПИЇОЛРПЧИЦРЗФЬРІИЇЇШЛСЯИФСЦРЇЧЄШЦАСЇШЧШІСХЗЧИЮДАФИНЧИЮЮИЦРВЧМЦИУШЙШЧСЛМЇСЛЯШЙШЕШЇШЧШЮФЬСПЄ"
};

let tab = "caesar";
let accent = "#00ffa3";
let lastDecrypt = false;
let timer;

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2000);
}

/* ============ Шифр Цезаря ============ */
function caesar(text, key, lang, decrypt = false) {
  const abc = ALPHABETS[lang], n = abc.length;
  const shift = (((decrypt ? -key : key) % n) + n) % n;
  return [...text].map(ch => {
    const up = ch.toUpperCase();
    const i = abc.indexOf(up);
    if (i === -1) return ch;
    const r = abc[(i + shift) % n];
    return ch === up ? r : r.toLowerCase();
  }).join("");
}

/* ============ Шифр перестановки ============ */
function columnOrder(keyChars) {
  return keyChars
    .map((c, i) => ({ c: c.toLowerCase(), i }))
    .sort((a, b) => a.c.localeCompare(b.c, "uk") || a.i - b.i)
    .map(o => o.i);
}

function transposition(text, keyChars, decrypt = false) {
  const chars = [...text], cols = keyChars.length, n = chars.length;
  const order = columnOrder(keyChars);
  if (!decrypt) {
    const out = [];
    for (const col of order) for (let r = col; r < n; r += cols) out.push(chars[r]);
    return { result: out.join(""), order, plain: chars };
  }
  const plain = new Array(n);
  let pos = 0;
  for (const col of order) for (let r = col; r < n; r += cols) plain[r] = chars[pos++];
  return { result: plain.join(""), order, plain };
}

function tableHtml(plain, keyChars, order) {
  if (plain.length > 300) return '<p class="hint">Текст завеликий для візуалізації таблиці.</p>';
  const cols = keyChars.length, rank = [];
  order.forEach((c, p) => { rank[c] = p + 1; });
  const show = ch => ch === " " ? "·" : ch === "\n" ? "↵" : escapeHtml(ch);

  let h = '<div class="table-wrap"><table><thead><tr>' +
    keyChars.map(c => `<th>${escapeHtml(c.toUpperCase())}</th>`).join("") +
    "</tr><tr>" + rank.map(r => `<th class="num">${r}</th>`).join("") + "</tr></thead><tbody>";
  for (let i = 0; i < plain.length; i += cols) {
    h += "<tr>";
    for (let j = 0; j < cols; j++) {
      const ch = plain[i + j];
      h += `<td style="animation-delay:${(i + j) * 20}ms">${ch === undefined ? "" : show(ch)}</td>`;
    }
    h += "</tr>";
  }
  return h + "</tbody></table></div>";
}

/* ============ Вивід з анімацією ============ */
function setOutput(text, animate = true) {
  const el = $("output");
  clearInterval(timer);
  if (!animate || text.length > 600) { el.value = text; return; }
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЮЯ#$%&@";
  const total = 24;
  let frame = 0;
  timer = setInterval(() => {
    frame++;
    const reveal = Math.floor(text.length * frame / total);
    el.value = [...text].map((ch, i) =>
      i < reveal || /\s/.test(ch) ? ch : pool[Math.random() * pool.length | 0]).join("");
    if (frame >= total) { clearInterval(timer); el.value = text; }
  }, 30);
}

/* ============ Візуалізації ============ */
function drawWheel() {
  const lang = $("lang").value, abc = ALPHABETS[lang], n = abc.length;
  const step = 360 / n, k = +$("key").value, viz = $("viz");
  if (viz.dataset.kind !== "wheel-" + lang) {
    const ring = r => [...abc].map((c, i) =>
      `<span class="l" style="transform:rotate(${i * step}deg) translateY(-${r}px)">${c}</span>`).join("");
    viz.innerHTML = `<h3>Шифрувальне колесо</h3>
      <div class="wheel">
        <div class="ring outer">${ring(150)}</div>
        <div class="ring inner" id="inner">${ring(108)}</div>
        <div class="hub"><small>K</small><b id="hubk"></b></div>
      </div>
      <p class="hint">Зовнішнє коло — відкритий текст, внутрішнє — шифротекст. Рухайте повзунок K.</p>`;
    viz.dataset.kind = "wheel-" + lang;
  }
  $("inner").style.transform = `rotate(${-k * step}deg)`;
  $("hubk").textContent = k;
}

function analyze(quiet) {
  const lang = $("lang").value, abc = ALPHABETS[lang], n = abc.length;
  const input = $("input").value, viz = $("viz");
  viz.dataset.kind = "";

  const counts = Object.fromEntries([...abc].map(c => [c, 0]));
  let total = 0;
  for (const ch of input.toUpperCase()) if (ch in counts) { counts[ch]++; total++; }

  if (!total) {
    if (!quiet) toast("Вставте шифротекст");
    viz.innerHTML = '<h3>Криптоаналіз</h3><p class="hint">Вставте шифротекст і натисніть «Аналізувати».</p>';
    return;
  }

  const top = [...abc].reduce((a, b) => counts[b] > counts[a] ? b : a);
  const pct = c => counts[c] / total * 100;
  const bars = [...abc].map(c =>
    `<div class="bar${c === top ? " top" : ""}" title="${c}: ${pct(c).toFixed(1)}%">
       <i style="height:${Math.round(counts[c] / counts[top] * 120)}px"></i><span>${c}</span></div>`).join("");

  // перебір усіх ключів + оцінка «схожості» на природну мову
  const rows = [];
  for (let k = 1; k < n; k++) {
    const dec = caesar(input, k, lang, true);
    let t = 0, h = 0;
    for (const ch of dec.toUpperCase()) if (abc.includes(ch)) { t++; if (COMMON[lang].includes(ch)) h++; }
    rows.push({ k, dec, score: h / t * 100 });
  }
  const best = rows.reduce((a, b) => b.score > a.score ? b : a);
  const guess = (abc.indexOf(top) - abc.indexOf(COMMON[lang][0]) + n) % n;

  viz.innerHTML = `<h3>Частотний аналіз</h3>
    <div class="chart">${bars}</div>
    <p class="hint">Найчастіша літера шифротексту: <b>${top}</b> (${pct(top).toFixed(1)}%).
      Якщо їй відповідає «${COMMON[lang][0]}», то K = <b>${guess}</b>.</p>
    <h3>Перебір усіх ключів</h3>
    <div class="brute"><table><thead><tr><th>K</th><th>Розшифрування</th><th>Схожість</th></tr></thead><tbody>
      ${rows.map(r => `<tr data-k="${r.k}" class="${r.k === best.k ? "best" : ""}">
        <td>${r.k}</td><td class="left">${escapeHtml(r.dec.slice(0, 48))}</td><td>${r.score.toFixed(0)}%</td></tr>`).join("")}
    </tbody></table></div>
    <p class="hint">Клікніть на рядок, щоб застосувати ключ. «Схожість» — частка найуживаніших літер мови в тексті.</p>`;

  viz.querySelectorAll("tr[data-k]").forEach(tr => tr.onclick = () => {
    const k = +tr.dataset.k;
    $("key").value = k; $("kval").textContent = k;
    setOutput(rows[k - 1].dec, true);
  });

  $("key").value = best.k; $("kval").textContent = best.k;
  setOutput(best.dec, !quiet);
}

/* ============ Головна логіка ============ */
function run(decrypt, animate = true) {
  lastDecrypt = decrypt;
  const input = $("input").value, lang = $("lang").value, k = +$("key").value, viz = $("viz");

  if (tab === "analysis") return analyze(!animate);

  if (tab === "caesar") {
    setOutput(caesar(input, k, lang, decrypt), animate);
    return drawWheel();
  }

  const keyChars = [...$("word").value.replace(/[^\p{L}]/gu, "")];
  if (keyChars.length < 2) {
    if (animate) toast("Ключове слово має містити мінімум 2 літери");
    return setOutput("", false);
  }
  const text = !decrypt && $("nospaces").checked ? input.replace(/\s+/g, "") : input;
  viz.dataset.kind = "";

  if (tab === "trans") {
    const r = transposition(text, keyChars, decrypt);
    setOutput(r.result, animate);
    viz.innerHTML = `<h3>Таблиця перестановки</h3>${tableHtml(r.plain, keyChars, r.order)}
      <p class="hint">Цифри — порядок зчитування стовпців. Крапка «·» — пробіл.</p>`;
  } else {
    let mid, out, r;
    if (!decrypt) {
      mid = caesar(text, k, lang, false);
      r = transposition(mid, keyChars, false);
      out = r.result;
    } else {
      r = transposition(text, keyChars, true);
      mid = r.result;
      out = caesar(mid, k, lang, true);
    }
    setOutput(out, animate);
    viz.innerHTML = `<h3>Подвійне шифрування</h3>
      <p class="hint">Крок 1: Цезар (K = ${k}) · Крок 2: перестановка (ключ «${escapeHtml(keyChars.join(""))}»)</p>
      <p class="step"><b>Проміжний текст (після Цезаря):</b><br>${escapeHtml(mid)}</p>
      ${tableHtml(r.plain, keyChars, r.order)}`;
  }
}

function refresh() {
  $("box-caesar").hidden = tab === "trans";
  $("box-trans").hidden = !(tab === "trans" || tab === "combo");
  $("k-wrap").hidden = tab === "analysis";
  $("btn-enc").hidden = $("btn-dec").hidden = tab === "analysis";
  $("btn-an").hidden = tab !== "analysis";
  $("live-wrap").hidden = tab === "analysis";
  $("output").value = "";
  run(false, false);
}

const live = () => {
  if ($("live").checked && tab !== "analysis") run(lastDecrypt, false);
  else if (tab === "caesar") drawWheel();
};

/* ============ Події ============ */
document.querySelectorAll(".tab").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  tab = b.dataset.tab;
  refresh();
});

$("lang").onchange = () => {
  const n = ALPHABETS[$("lang").value].length;
  $("key").max = n - 1;
  if (+$("key").value > n - 1) $("key").value = n - 1;
  $("kval").textContent = $("key").value;
  live();
};
$("key").oninput = () => { $("kval").textContent = $("key").value; live(); };
$("word").oninput = live;
$("nospaces").onchange = live;
$("input").oninput = live;

$("btn-enc").onclick = () => run(false);
$("btn-dec").onclick = () => run(true);
$("btn-an").onclick = () => run(false);

$("btn-sample").onclick = () => {
  $("input").value = SAMPLES[tab];
  if (tab === "analysis") { $("lang").value = "uk"; $("lang").onchange(); }
  run(false);
};
$("btn-copy").onclick = () =>
  navigator.clipboard.writeText($("output").value).then(() => toast("Скопійовано ✔"));
$("btn-swap").onclick = () => {
  $("input").value = $("output").value;
  $("output").value = "";
  toast("Результат переміщено у вхід");
};
$("btn-dl").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([$("output").value], { type: "text/plain;charset=utf-8" }));
  a.download = "result.txt";
  a.click();
  URL.revokeObjectURL(a.href);
};
$("btn-clear").onclick = () => {
  $("input").value = ""; $("output").value = "";
  if (tab === "analysis") analyze(true);
};

document.querySelectorAll(".dot").forEach(d => d.onclick = () => {
  accent = d.dataset.color;
  document.documentElement.style.setProperty("--accent", accent);
});

/* ============ Цифровий дощ на фоні ============ */
const cv = $("rain"), ctx = cv.getContext("2d");
let drops = [];
function sizeRain() {
  cv.width = innerWidth;
  cv.height = innerHeight;
  drops = Array.from({ length: Math.ceil(cv.width / 18) }, () => Math.random() * cv.height / 18);
}
addEventListener("resize", sizeRain);
sizeRain();

setInterval(() => {
  ctx.fillStyle = "rgba(7, 9, 18, 0.1)";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = accent;
  ctx.font = "16px monospace";
  const pool = ALPHABETS.uk + ALPHABETS.en + "0123456789";
  drops.forEach((y, i) => {
    ctx.fillText(pool[Math.random() * pool.length | 0], i * 18, y * 18);
    drops[i] = y * 18 > cv.height && Math.random() > 0.975 ? 0 : y + 1;
  });
}, 60);

/* ============ Старт ============ */
$("input").value = SAMPLES.caesar;
refresh();