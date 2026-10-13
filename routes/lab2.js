const express = require("express");
const jwt = require("jsonwebtoken");
const { findByCredentials } = require("../users");
const cfg = require("../config");

const router = express.Router();

/* ---------- Частина 1: /login (HTTP Basic + SHA-256) ---------- */

function parseBasic(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const i = decoded.indexOf(":");
  if (i === -1) return null;
  return { login: decoded.slice(0, i), password: decoded.slice(i + 1) };
}

function basicAuth(req, res, next) {
  const creds = parseBasic(req);
  const user = creds && findByCredentials(creds.login, creds.password);

  if (!user) {
    // Вікно логіну показуємо лише при відкритті у браузері (а не при fetch / Postman)
    if ((req.headers.accept || "").includes("text/html")) {
      res.set("WWW-Authenticate", 'Basic realm="CipherLab", charset="UTF-8"');
    }
    return res.status(401).send("401: потрібна авторизація (невірний логін або пароль)");
  }
  req.user = user;
  next();
}

router.get("/login", basicAuth, (req, res) => {
  res.send(`Користувача ${req.user.login} (id: ${req.user.id}) успішно авторизовано`);
});

/* ---------- Частина 2: JWT ---------- */

// Видача токена: логін + пароль → JWT
router.post("/token", (req, res) => {
  const { login, password } = req.body || {};
  const user =
    typeof login === "string" && typeof password === "string"
      ? findByCredentials(login, password)
      : null;

  if (!user) {
    return res.status(401).json({ error: "Невірний логін або пароль" });
  }

  const expiresIn = `${cfg.LIST_NUMBER}${cfg.TOKEN_TTL_UNIT}`; // напр. "5m"
  const token = jwt.sign(
    { login: user.login, id: user.id },   // payload
    cfg.JWT_SECRET,                       // secret
    { algorithm: cfg.JWT_ALGORITHM, expiresIn }
  );
  res.json({ token, expiresIn });
});

// Middleware: перевірка Bearer-токена
function jwtAuth(req, res, next) {
  const [type, token] = (req.headers.authorization || "").split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Потрібен заголовок Authorization: Bearer <токен>" });
  }
  try {
    req.jwt = jwt.verify(token, cfg.JWT_SECRET, { algorithms: [cfg.JWT_ALGORITHM] });
    next();
  } catch (e) {
    const expired = e.name === "TokenExpiredError";
    res.status(401).json({
      error: expired ? "Термін дії токена минув" : "Невалідний токен",
      reason: e.name
    });
  }
}

// Захищений шлях — лише з валідним токеном
router.get("/protected", jwtAuth, (req, res) => {
  res.json({
    message: `Доступ дозволено. Вітаємо, ${req.jwt.login}!`,
    payload: req.jwt
  });
});

module.exports = router;