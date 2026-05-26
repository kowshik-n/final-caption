console.log("[Teams Caption Sender] Content script started");

const SERVER_URL = "http://localhost:3100/api/caption"; // Node.js backend
const API_KEY = "localSecretKey"; // Local key

const CAPTION_SELECTOR = '[data-tid="closed-caption-text"]';
let lastCaption = "";
let lastSentTime = 0;
const MIN_SEND_INTERVAL = 1000; // Minimum 1 second between sends
let captionCount = 0;

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

// Text-to-speech function - DISABLED to avoid interference
// function speakText(text) {
//   console.log("[🔊 Playing Audio Response]", text);
//   
//   const utterance = new SpeechSynthesisUtterance(text);
//   utterance.rate = 1.0;
//   utterance.pitch = 1.0;
//   utterance.volume = 1.0;
//   
//   speechSynthesis.cancel();
//   speechSynthesis.speak(utterance);
// }

// Send caption to Node.js backend
function sendToServer(text) {
  console.log("[📤 Send to Backend]", text);
  
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
    
    // Just log the response - don't play audio to avoid interference
    console.log("[💬 System Response (Audio Disabled)]", data.response);
  })
  .catch((err) => {
    console.error("[❌ ERROR] Failed to send caption:", err);
  });
}

// Track to avoid duplicates
let previousSpeakers = [];
const SPEAKER_HISTORY_LIMIT = 3;

// Watch DOM changes for captions
const observer = new MutationObserver(() => {
  const cap = extractCaption();
  const now = Date.now();
  
  // Only send if: caption changed AND enough time has passed
  if (cap && cap !== lastCaption && (now - lastSentTime) > MIN_SEND_INTERVAL && cap.trim().length > 0) {
    // Filter out TTS/system responses
    const isTTSResponse = cap.toLowerCase().includes("understood") || 
                          cap.toLowerCase().includes("got it") ||
                          cap.toLowerCase().includes("thanks for that") ||
                          cap.toLowerCase().includes("i hear you") ||
                          cap.toLowerCase().includes("message received") ||
                          cap.toLowerCase().includes("noted");
    
    if (!isTTSResponse) {
      lastCaption = cap;
      lastSentTime = now;
      console.log("[🎙️ Caption Detected]", cap);
      sendToServer(cap);
    } else {
      console.log("[⏭️  Skipped (TTS Response)]", cap);
    }
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
