const crypto = require("crypto");

// Простий SHA-256 без солі (за умовою лабораторної)
const sha256 = text =>
  crypto.createHash("sha256").update(text, "utf8").digest("hex");

// Пароль у відкритому вигляді тут НЕ зберігається — лише його хеш.
// Логін = прізвище, пароль = ім'я, id = номер у списку групи.
// ← Замініть на дані своїх трьох користувачів (ви, той, хто вище, той, хто нижче)
const users = [
  { id: 3, login: "Boyko",  passwordHash: "e61438bc8f6dc4e79d749a3d8231086aa77456ddfe679f757ec900114a4c4fa4" }, // пароль: Petro
  { id: 4, login: "Voznyi",  passwordHash: "854d94f3a842f52a24588f74d489fa2e32bfa2173822ed30a2de294047615292" }, // пароль: Mykhailo
  { id: 5, login: "Harasym", passwordHash: "d1e5f2f9665a746957be0a1bfb42d7732da40bc922678068d896afb140afd2a1" }  // пароль: Serhii
];

// Порівнюємо хеш введеного пароля з хешем у "базі"
function findByCredentials(login, password) {
  const hash = sha256(password);
  return users.find(u => u.login === login && u.passwordHash === hash) || null;
}

module.exports = { sha256, findByCredentials };