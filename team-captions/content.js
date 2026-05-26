const SERVER_URL = "http://localhost:3100/api/caption";
const API_KEY = "localSecretKey";
const CAPTION_SELECTOR = '[data-tid="closed-caption-text"]';
const SILENCE_DURATION = 5000;

let lastCaption = "";
let lastSentTime = 0;
let silenceTimeoutId = null;
let pendingCaption = "";

function extractCaption() {
  const nodes = document.querySelectorAll(CAPTION_SELECTOR);
  if (!nodes.length) return "";

  const parts = [];
  nodes.forEach((node) => {
    const txt = (node.innerText || node.textContent || "").trim();
    if (txt) parts.push(txt);
  });

  return parts.join(" ");
}

function playSystemResponse(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function sendToServer(text) {
  if (silenceTimeoutId) {
    clearTimeout(silenceTimeoutId);
    silenceTimeoutId = null;
  }
  pendingCaption = "";
  
  fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ text }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.isSystemResponse && data.response) {
      playSystemResponse(data.response);
    }
  })
  .catch((err) => {
    console.error("Failed to send caption:", err);
  });
}

function startSilenceTimer(caption) {
  if (silenceTimeoutId) {
    clearTimeout(silenceTimeoutId);
  }
  
  pendingCaption = caption;
  
  silenceTimeoutId = setTimeout(() => {
    if (pendingCaption === caption && pendingCaption !== "") {
      sendToServer(caption);
    }
  }, SILENCE_DURATION);
}

const observer = new MutationObserver(() => {
  const cap = extractCaption();
  const now = Date.now();
  
  if (cap && cap !== lastCaption && (now - lastSentTime) > 1000 && cap.trim().length > 0) {
    lastCaption = cap;
    lastSentTime = now;
    startSilenceTimer(cap);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});
