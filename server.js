const express = require("express");
const path = require("path");
const { ALPHABETS, caesar, transposition } = require("./ciphers");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));

// ---------- Лабораторна 2: /login, /token, /protected ----------
app.use(require("./routes/lab2"));

app.use(express.static(path.join(__dirname, "public")));

// ---------- Лабораторна 1: API шифрів ----------
app.post("/api/caesar", (req, res) => {
  const { text, key, lang = "uk", decrypt = false } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json({ error: "Поле text має бути рядком" });
  }
  if (!ALPHABETS[lang]) {
    return res.status(400).json({ error: "lang має бути 'uk' або 'en'" });
  }
  const n = ALPHABETS[lang].length;
  if (!Number.isInteger(key) || key < 1 || key > n - 1) {
    return res.status(400).json({ error: `key має бути цілим числом від 1 до ${n - 1}` });
  }
  res.json({ result: caesar(text, key, lang, Boolean(decrypt)) });
});

app.post("/api/transposition", (req, res) => {
  const { text, key, decrypt = false } = req.body;
  if (typeof text !== "string" || typeof key !== "string") {
    return res.status(400).json({ error: "Поля text і key мають бути рядками" });
  }
  const keyChars = [...key.replace(/[^\p{L}]/gu, "")];
  if (keyChars.length < 2) {
    return res.status(400).json({ error: "Ключове слово має містити щонайменше 2 літери" });
  }
  res.json({ result: transposition(text, keyChars, Boolean(decrypt)) });
});

// Локально запускаємо сервер, на Vercel застосунок просто експортується
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CipherLab запущено: http://localhost:${PORT}`);
  });
}

module.exports = app;