/* Лабораторна 2: Basic-авторизація (/login) та JWT (/token, /protected) */
(() => {
  const $ = id => document.getElementById(id);
  let token = "";
  let countdown;

  /* ---------- Допоміжні функції ---------- */
  const b64urlDecode = s => {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bytes = Uint8Array.from(atob(s), c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const basicHeader = (login, pass) => {
    const bytes = new TextEncoder().encode(`${login}:${pass}`);
    return "Basic " + btoa(String.fromCharCode(...bytes));
  };

  const fmtTime = sec => {
    sec = Math.max(0, Math.ceil(sec));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  };

  function print(id, text, ok) {
    const el = $(id);
    el.textContent = text;
    el.classList.remove("ok", "bad");
    el.classList.add(ok ? "ok" : "bad");
  }

  // підсвічує кроки схеми автентифікації
  function setStep(n) {
    document.querySelectorAll("#l2-flow li").forEach(li => {
      const s = +li.dataset.s;
      li.classList.toggle("done", s < n);
      li.classList.toggle("current", s === n);
    });
  }

  /* ---------- 1. /login (Basic + SHA-256) ---------- */
  $("l2-check").onclick = async () => {
    const res = await fetch("/login", {
      headers: { Authorization: basicHeader($("l2-login").value, $("l2-pass").value) }
    });
    const text = await res.text();
    print("l2-login-out", `GET /login → ${res.status}\n${text}`, res.ok);
    if (res.ok) setStep(1);
  };

  $("l2-open").onclick = () => window.open("/login", "_blank");

  /* ---------- 2. JWT ---------- */
  function renderToken() {
    const [h, p, s] = token.split(".");
    $("l2-token-box").classList.remove("empty");
    $("l2-token-box").innerHTML =
      `<span class="h">${h}</span>.<span class="p">${p}</span>.<span class="s">${s}</span>`;

    const header = JSON.parse(b64urlDecode(h));
    const payload = JSON.parse(b64urlDecode(p));
    const date = t => new Date(t * 1000).toLocaleString("uk-UA");

    $("l2-header").textContent = JSON.stringify(header, null, 2);
    $("l2-payload").textContent = JSON.stringify(payload, null, 2) +
      `\n\niat — ${date(payload.iat)}\nexp — ${date(payload.exp)}`;
    $("l2-decoded").hidden = false;
    $("l2-timer").hidden = false;

    clearInterval(countdown);
    const tick = () => {
      const total = payload.exp - payload.iat;
      const left = payload.exp - Date.now() / 1000;
      $("l2-bar").style.width = Math.max(0, Math.min(100, left / total * 100)) + "%";
      const expired = left <= 0;
      $("l2-timer").classList.toggle("expired", expired);
      $("l2-left").textContent = expired
        ? "⛔ Термін дії токена минув"
        : `⏳ Залишилось ${fmtTime(left)} із ${fmtTime(total)}`;
      if (expired) clearInterval(countdown);
    };
    tick();
    countdown = setInterval(tick, 250);
  }

  $("l2-token").onclick = async () => {
    const res = await fetch("/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: $("l2-login").value, password: $("l2-pass").value })
    });
    const data = await res.json();
    if (!res.ok) {
      print("l2-prot-out", `POST /token → ${res.status}\n${data.error}`, false);
      return;
    }
    token = data.token;
    renderToken();
    print("l2-prot-out", `POST /token → ${res.status}\nТокен видано, діє ${data.expiresIn}`, true);
    setStep(2);
  };

  async function callProtected(withToken) {
    if (withToken && !token) return toast("Спершу отримайте токен");
    const res = await fetch("/protected", {
      headers: withToken ? { Authorization: "Bearer " + token } : {}
    });
    const data = await res.json();
    print("l2-prot-out", `GET /protected → ${res.status}\n${JSON.stringify(data, null, 2)}`, res.ok);
    setStep(res.ok ? 4 : 3);
  }

  $("l2-protected").onclick = () => callProtected(true);
  $("l2-noauth").onclick = () => callProtected(false);

  // змінюємо першу літеру підпису → підпис більше не збігається
  $("l2-tamper").onclick = () => {
    if (!token) return toast("Спершу отримайте токен");
    const [h, p, s] = token.split(".");
    token = `${h}.${p}.${s[0] === "A" ? "B" : "A"}${s.slice(1)}`;
    renderToken();
    toast("Підпис змінено — спробуйте /protected");
  };

  $("l2-jwtio").onclick = () => {
    if (!token) return toast("Спершу отримайте токен");
    navigator.clipboard.writeText(token).then(() => toast("Токен скопійовано — вставте його на jwt.io"));
    window.open("https://jwt.io", "_blank");
  };

  /* ---------- 3. Калькулятор SHA-256 ---------- */
  async function sha256hex(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  $("l2-sha-in").oninput = async e => {
    $("l2-sha-out").textContent = e.target.value ? await sha256hex(e.target.value) : "—";
  };
})();