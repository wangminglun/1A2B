const { formatResultHtml } = window.GameLogic;

const historyEl = document.getElementById("history");
const historyEmptyEl = document.getElementById("historyEmpty");
const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const guessResult = document.getElementById("guessResult");
const feedbackEl = document.getElementById("feedback");
const attemptMeterEl = document.getElementById("attemptMeter");
const restartBtn = document.getElementById("restartBtn");
const overlayEl = document.getElementById("overlay");
const modalEmojiEl = document.getElementById("modalEmoji");
const modalTitleEl = document.getElementById("modalTitle");
const modalTextEl = document.getElementById("modalText");
const modalBtn = document.getElementById("modalBtn");
const confettiCanvas = document.getElementById("confetti");

let game = new window.GameLogic.Game();
let confettiFrame = null;

function normalizeDigits(value) {
  return value.replace(/[\uFF10-\uFF19]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xff10 + 0x30),
  );
}

function sanitizeInput(value) {
  return normalizeDigits(value).replace(/\D/g, "").slice(0, DIGIT_COUNT);
}

function renderAttemptMeter() {
  attemptMeterEl.innerHTML = "";
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const dot = document.createElement("span");
    dot.className = "attempt-dot";
    if (i < game.attempts) {
      dot.classList.add("used");
    } else {
      dot.classList.add("left");
    }
    attemptMeterEl.appendChild(dot);
  }
}

function setFeedback(message, isError = false) {
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle("error", isError);
}

function createHistoryRow(entry) {
  const row = document.createElement("li");
  row.className = "history-row";
  if (entry.a === DIGIT_COUNT && entry.b === 0) {
    row.classList.add("win-row");
  }

  row.innerHTML = `
    <span class="guess-digits">${entry.guess}</span>
    <span class="result-chip">${formatResultHtml(entry.a, entry.b)}</span>
  `;
  return row;
}

function refreshHistory() {
  historyEl.innerHTML = "";
  game.history.forEach((entry) => {
    historyEl.appendChild(createHistoryRow(entry));
  });
  historyEmptyEl.hidden = game.history.length > 0;
}

function refreshStatus() {
  renderAttemptMeter();
  if (!game.isOver) {
    setFeedback(`第 ${game.attempts + 1} 次 · 剩餘 ${game.remaining} 次 · Enter 或「送出」確認`);
  }
}

function showModal({ emoji, title, text }) {
  modalEmojiEl.textContent = emoji;
  modalTitleEl.textContent = title;
  modalTextEl.textContent = text;
  overlayEl.classList.remove("hidden");
}

function hideModal() {
  overlayEl.classList.add("hidden");
}

function launchConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight * 0.2,
    size: 4 + Math.random() * 6,
    speed: 2 + Math.random() * 4,
    drift: -1 + Math.random() * 2,
    hue: Math.random() * 360,
    rotation: Math.random() * Math.PI,
  }));

  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  let ticks = 0;
  const draw = () => {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    pieces.forEach((piece) => {
      piece.y += piece.speed;
      piece.x += piece.drift;
      piece.rotation += 0.08;
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.fillStyle = `hsl(${piece.hue}, 90%, 60%)`;
      ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      ctx.restore();
    });
    ticks += 1;
    if (ticks < 180) {
      confettiFrame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiFrame = null;
    }
  };

  if (confettiFrame) {
    cancelAnimationFrame(confettiFrame);
  }
  draw();
}

function finishGame(won) {
  guessInput.disabled = true;
  if (won) {
    setFeedback(`恭喜！第 ${game.attempts} 次猜中 4A0B`);
    showModal({
      emoji: "🎉",
      title: "恭喜破關！",
      text: `你只用了 ${game.attempts} 次就猜中 4A0B`,
    });
    launchConfetti();
    return;
  }

  setFeedback(`機會用完，答案為 ${game.secret}`);
  showModal({
    emoji: "💫",
    title: "下次再來",
    text: `正確答案是 ${game.secret}`,
  });
}

function submitGuess(showErrors = true) {
  if (game.isOver) {
    if (showErrors) {
      setFeedback("本局已結束，請按「重新開始」。", true);
    }
    return false;
  }

  const value = sanitizeInput(guessInput.value);
  guessInput.value = value;

  if (value.length !== DIGIT_COUNT) {
    if (showErrors) {
      setFeedback(`請輸入 ${DIGIT_COUNT} 位不重複數字後再按 Enter。`, true);
    }
    return false;
  }

  try {
    const result = game.guess(value);
    guessResult.innerHTML = formatResultHtml(result.a, result.b);
    refreshHistory();
    refreshStatus();
    guessInput.value = "";

    if (result.a === DIGIT_COUNT && result.b === 0) {
      finishGame(true);
    } else if (game.isOver) {
      finishGame(false);
    }
    return true;
  } catch (error) {
    if (showErrors) {
      setFeedback(error.message, true);
    }
    guessResult.textContent = "";
    return false;
  }
}

function restartGame() {
  hideModal();
  game = new window.GameLogic.Game();
  guessInput.value = "";
  guessInput.disabled = false;
  guessResult.textContent = "";
  refreshHistory();
  refreshStatus();
  guessInput.focus();
}

guessInput.addEventListener("input", () => {
  const sanitized = sanitizeInput(guessInput.value);
  if (guessInput.value !== sanitized) {
    guessInput.value = sanitized;
  }

  if (sanitized.length > 0 && sanitized.length < DIGIT_COUNT) {
    guessResult.textContent = "";
    setFeedback(`第 ${game.attempts + 1} 次 · 剩餘 ${game.remaining} 次 · Enter 或「送出」確認`);
  }
});

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitGuess(true);
});

guessInput.addEventListener("keydown", (event) => {
  if (event.isComposing) {
    return;
  }
  if (event.key === "Enter" || event.key === "NumpadEnter") {
    event.preventDefault();
    submitGuess(true);
  }
});

restartBtn.addEventListener("click", restartGame);
modalBtn.addEventListener("click", restartGame);
overlayEl.addEventListener("click", (event) => {
  if (event.target === overlayEl) {
    hideModal();
  }
});

window.addEventListener("resize", () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

restartGame();
