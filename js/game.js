const DIGIT_COUNT = 4;
const MAX_ATTEMPTS = 10;

function generateSecret() {
  const digits = "0123456789".split("");
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, DIGIT_COUNT).join("");
}

function validateGuess(value) {
  if (value.length !== DIGIT_COUNT) {
    return `請輸入 ${DIGIT_COUNT} 位數字。`;
  }
  if (!/^\d+$/.test(value)) {
    return "只能輸入數字 0-9。";
  }
  if (new Set(value).size !== DIGIT_COUNT) {
    return "每個數字不能重複。";
  }
  return null;
}

function score(secret, guess) {
  let a = 0;
  for (let i = 0; i < DIGIT_COUNT; i += 1) {
    if (secret[i] === guess[i]) {
      a += 1;
    }
  }

  let common = 0;
  for (const digit of new Set(guess)) {
    common += Math.min(
      secret.split("").filter((d) => d === digit).length,
      guess.split("").filter((d) => d === digit).length,
    );
  }

  return { a, b: common - a };
}

class Game {
  constructor(secret = null, maxAttempts = MAX_ATTEMPTS) {
    this.secret = secret || generateSecret();
    this.maxAttempts = maxAttempts;
    this.attempts = 0;
    this.history = [];
  }

  get isOver() {
    if (this.attempts >= this.maxAttempts) {
      return true;
    }
    const last = this.history[this.history.length - 1];
    return Boolean(last && last.a === DIGIT_COUNT && last.b === 0);
  }

  get remaining() {
    return Math.max(0, this.maxAttempts - this.attempts);
  }

  guess(value) {
    if (this.isOver) {
      throw new Error("Game is already over.");
    }

    const error = validateGuess(value.trim());
    if (error) {
      throw new Error(error);
    }

    this.attempts += 1;
    const result = score(this.secret, value.trim());
    const entry = { guess: value.trim(), ...result };
    this.history.push(entry);
    return entry;
  }
}

window.GameLogic = {
  DIGIT_COUNT,
  MAX_ATTEMPTS,
  Game,
  formatResult(a, b) {
    return `${a}A${b}B`;
  },
  formatResultHtml(a, b) {
    return `<span class="a">${a}A</span><span class="b">${b}B</span>`;
  },
};
