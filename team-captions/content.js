const SERVER_URL = "http://localhost:3100/api/caption";
const API_KEY = "localSecretKey";
const CAPTION_SELECTOR = '[data-tid="closed-caption-text"]';
const SILENCE_DURATION = 5000;
const USE_COPILOT = true; // Set to false to use backend instead

let lastCaption = "";
let lastSentTime = 0;
let silenceTimeoutId = null;
let pendingCaption = "";
let isAudioPlaying = false;

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

function clearOldCaptions() {
  const nodes = document.querySelectorAll(CAPTION_SELECTOR);
  nodes.forEach((node) => {
    node.innerText = "";
    node.textContent = "";
  });
  console.log("[Teams] Cleared old captions");
}

function createStopButton() {
  // Remove existing button if present
  let existingButton = document.getElementById("copilot-stop-button");
  if (existingButton) {
    existingButton.remove();
  }

  const button = document.createElement("button");
  button.id = "copilot-stop-button";
  button.innerText = "Stop Audio";
  button.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    z-index: 10000;
    padding: 10px 20px;
    background-color: #d32f2f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: none;
  `;

  button.addEventListener("click", () => {
    console.log("[Teams] Stop button clicked");
    window.speechSynthesis.cancel();
    isAudioPlaying = false;
    button.style.display = "none";
  });

  document.body.appendChild(button);
  return button;
}

function showStopButton() {
  let stopButton = document.getElementById("copilot-stop-button");
  if (!stopButton) {
    stopButton = createStopButton();
  }
  stopButton.style.display = "block";
  console.log("[Teams] Stop button shown");
}

function hideStopButton() {
  const stopButton = document.getElementById("copilot-stop-button");
  if (stopButton) {
    stopButton.style.display = "none";
  }
  console.log("[Teams] Stop button hidden");
}

function playSystemResponse(text) {
  console.log("[Teams] playSystemResponse received text length:", text.length);
  console.log("[Teams] Text to play:", text);
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Log when speech starts and ends
  utterance.onstart = () => {
    console.log("[Teams] Speech started");
    isAudioPlaying = true;
    showStopButton();
  };
  utterance.onend = () => {
    console.log("[Teams] Speech ended");
    isAudioPlaying = false;
    hideStopButton();
  };
  utterance.onerror = (e) => {
    console.log("[Teams] Speech error:", e);
    isAudioPlaying = false;
    hideStopButton();
  };
  
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function sendToServer(text) {
  if (silenceTimeoutId) {
    clearTimeout(silenceTimeoutId);
    silenceTimeoutId = null;
  }
  
  // Clear old captions before sending new one
  clearOldCaptions();
  pendingCaption = "";
  
  if (USE_COPILOT) {
    sendToCopilot(text);
  } else {
    sendToBackend(text);
  }
}

function sendToCopilot(text) {
  console.log("[Teams] Sending to Copilot:", text);
  
  chrome.runtime.sendMessage(
    { action: "sendToCopilot", caption: text },
    (response) => {
      console.log("[Teams] Received response from Copilot:", response);
      
      if (response && response.success) {
        console.log("[Teams] Playing audio for:", response.response.substring(0, 100));
        playSystemResponse(response.response);
      } else {
        console.error("[Teams] Copilot error:", response?.error || "Unknown error");
      }
    }
  );
}

function sendToBackend(text) {
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
