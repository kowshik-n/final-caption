console.log("[Teams Caption Sender] Content script started");

const SERVER_URL = "http://localhost:3100/api/caption"; // Node.js backend
const API_KEY = "localSecretKey"; // Local key

const CAPTION_SELECTOR = '[data-tid="closed-caption-text"]';
let lastCaption = "";
let lastSentTime = 0;
const MIN_SEND_INTERVAL = 1000; // Minimum 1 second between sends
let captionCount = 0;

// Track last system response to prevent re-sending it
let lastSystemResponse = "";

// Flag to track when system audio is playing
let isPlayingSystemAudio = false;

// Timeout ID for clearing system audio flag
let systemAudioTimeoutId = null;

// Timeout for silence detection (5 seconds)
let silenceTimeoutId = null;
const SILENCE_DURATION = 5000; // 5 seconds
let pendingCaption = ""; // Store caption waiting to be sent

// Inject system response into Teams DOM with speaker label
function injectSystemCaptionToDom(text) {
  console.log("[💉 Injecting System Caption to DOM]", text);
  
  // Find the caption text element
  const captionElement = document.querySelector(CAPTION_SELECTOR);
  if (captionElement) {
    // Mark as system response so we can filter it
    captionElement.setAttribute('data-system-response', 'true');
    
    // Inject with SYSTEM speaker label
    const systemLabel = `[SYSTEM] ${text}`;
    captionElement.textContent = systemLabel;
    console.log("[✅ Injected into DOM]", systemLabel);
  }
}

// Extract caption text from Teams DOM
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
  console.log("[🔊 Playing System Audio Response]", text);
  
  // PAUSE caption capture - don't listen to captions while system speaks
  console.log("[⏸️  PAUSING caption observer]");
  observer.disconnect();
  
  // Inject into Teams DOM with [SYSTEM] label (for visual reference)
  injectSystemCaptionToDom(text);
  
  // Store the response
  lastSystemResponse = text;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Estimate audio duration
  const estimatedDuration = (text.length / 3) * 1000 + 1500; // rough estimate + 1.5s buffer
  
  // When audio finishes, resume capture
  utterance.onend = () => {
    console.log("[▶️  RESUMING caption observer]");
    // Clear DOM
    const captionElement = document.querySelector(CAPTION_SELECTOR);
    if (captionElement) {
      captionElement.textContent = '';
      captionElement.removeAttribute('data-system-response');
    }
    // Resume listening
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  };
  
  // Also resume after estimated time (fallback)
  if (systemAudioTimeoutId) {
    clearTimeout(systemAudioTimeoutId);
  }
  systemAudioTimeoutId = setTimeout(() => {
    console.log("[▶️  RESUMING caption observer (timeout)]");
    // Clear DOM
    const captionElement = document.querySelector(CAPTION_SELECTOR);
    if (captionElement) {
      captionElement.textContent = '';
      captionElement.removeAttribute('data-system-response');
    }
    // Resume listening
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }, estimatedDuration);
  
  // Cancel any previous speech
  window.speechSynthesis.cancel();
  
  // Play the response audio
  window.speechSynthesis.speak(utterance);
}

// Send caption to Node.js backend
function sendToServer(text) {
  console.log("[📤 Send to Backend]", text);
  
  // Clear the silence timer since we're sending now
  if (silenceTimeoutId) {
    clearTimeout(silenceTimeoutId);
    silenceTimeoutId = null;
  }
  pendingCaption = ""; // Clear pending caption
  
  fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ text }),
  })
  .then(res => {
    console.log("[Response Status]", res.status);
    return res.json();
  })
  .then(data => {
    console.log("[✅ Backend Response]", data);
    captionCount++;
    console.log(`[Caption Count] ${captionCount} captions sent successfully`);
    console.log("[📝 Response from Backend]", data.response);
    
    // Play the system response audio (if marked as system response)
    if (data.isSystemResponse && data.response) {
      console.log("[💾 System Response Received]", data.response);
      
      // Play the system response audio (isolated, won't be captured by Teams mic)
      playSystemResponse(data.response);
    }
  })
  .catch((err) => {
    console.error("[❌ ERROR] Failed to send caption:", err);
  });
}

// Track to avoid duplicates
let previousSpeakers = [];
const SPEAKER_HISTORY_LIMIT = 3;

// Function to handle silence detection - sends after 5 seconds of no new captions
function startSilenceTimer(caption) {
  // Clear previous timer if exists
  if (silenceTimeoutId) {
    clearTimeout(silenceTimeoutId);
    console.log("[🔄 Silence Timer Reset] New caption received, restarting 5 second counter...");
  } else {
    console.log("[⏱️  Silence Timer Started] Waiting 5 seconds for user to finish speaking...");
  }
  
  pendingCaption = caption;
  
  // Set new timer - send after 5 seconds of silence
  silenceTimeoutId = setTimeout(() => {
    // Only send if the caption hasn't changed (meaning user is silent)
    if (pendingCaption === caption && pendingCaption !== "") {
      console.log("[✅ Silence Detected - 5 Seconds Passed] Sending: ", caption);
      sendToServer(caption);
    }
  }, SILENCE_DURATION);
}

// Watch DOM changes for captions
const observer = new MutationObserver(() => {
  const cap = extractCaption();
  const now = Date.now();
  
  // Only process if: caption changed AND enough time has passed
  if (cap && cap !== lastCaption && (now - lastSentTime) > MIN_SEND_INTERVAL && cap.trim().length > 0) {
    // Skip if this is a system response (marked with [SYSTEM] prefix)
    if (cap.toLowerCase().startsWith("[system]")) {
      console.log("[⏭️  Skipped (System Caption)]", cap);
      return;
    }
    
    // New caption detected - update state
    lastCaption = cap;
    lastSentTime = now;
    console.log("[🎙️ Caption Detected]", cap);
    console.log("[⏳ Waiting for user to finish speaking (5 seconds of silence)...");
    
    // Start silence timer - will send after 5 seconds of no new captions
    startSilenceTimer(cap);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

console.log("[✅ Observer] MutationObserver started - Captions are being monitored");

// Initial check
console.log("[🔍 Initial Check] Checking for existing captions...");
const initialCap = extractCaption();
if (initialCap) {
  console.log("[📢 Found Initial Caption]", initialCap);
}
