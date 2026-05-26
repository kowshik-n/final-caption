console.log("[Teams Caption Sender] Background ready.");

// Handle message passing between content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToCopilot") {
    // Find Copilot tab and send message to it
    chrome.tabs.query({ url: "*://copilot.microsoft.com/*" }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ success: false, error: "Copilot tab not found. Please open copilot.microsoft.com" });
      } else {
        // Send to Copilot helper
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      }
    });
    return true; // Keep channel open
  }
});

