let isWaitingForResponse = false;
let responseText = "";

// Listen for messages from the Teams extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Copilot Helper] Received message from Teams:", request);
  
  if (request.action === "sendToCopilot") {
    console.log("[Copilot Helper] Processing caption:", request.caption);
    sendToCopilot(request.caption).then((response) => {
      console.log("[Copilot Helper] Extracted response - Length:", response.length);
      console.log("[Copilot Helper] Response text:", response);
      console.log("[Copilot Helper] Sending back to Teams...");
      sendResponse({ success: true, response: response });
    }).catch((error) => {
      console.error("[Copilot Helper] Error:", error.message);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});

async function sendToCopilot(caption) {
  try {
    // Find the input field using the correct ID
    const inputField = document.querySelector('#userInput');
    
    if (!inputField) {
      throw new Error("Could not find Copilot input field");
    }

    console.log("[Copilot Helper] Found input field");

    // Clear any existing text
    inputField.value = "";
    inputField.textContent = "";

    // Type the caption
    inputField.value = caption;
    inputField.textContent = caption;

    console.log("[Copilot Helper] Set input text to:", caption);

    // Trigger input event
    inputField.dispatchEvent(new Event("input", { bubbles: true }));
    inputField.dispatchEvent(new Event("change", { bubbles: true }));

    // Find and click send button using data-testid
    const sendButton = document.querySelector('button[data-testid="submit-button"]') ||
                      document.querySelector('button[aria-label*="Submit"]') ||
                      document.querySelector('button[title*="Submit"]');

    if (!sendButton) {
      throw new Error("Could not find Copilot send button");
    }

    console.log("[Copilot Helper] Found send button, clicking...");
    sendButton.click();

    // Wait for response
    console.log("[Copilot Helper] Waiting for Copilot response...");
    const response = await waitForCopilotResponse();
    console.log("[Copilot Helper] Got response, returning to Teams");
    return response;

  } catch (error) {
    console.error("[Copilot Helper] Error sending to Copilot:", error);
    throw error;
  }
}

async function waitForCopilotResponse() {
  return new Promise((resolve, reject) => {
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    let lastResponseLength = 0;
    let noChangeCount = 0;

    const checkForResponse = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed > maxWaitTime) {
        clearInterval(checkForResponse);
        reject(new Error("Timeout waiting for Copilot response"));
        return;
      }

      // Look for AI message containers
      const aiMessages = document.querySelectorAll('[data-testid="ai-message"]');
      
      if (aiMessages.length > 0) {
        // Get the LAST AI message (most recent response)
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        
        // Find the content container - it has id="...-content-0"
        const contentArea = lastAiMessage.querySelector('[id*="content"]');
        
        if (contentArea) {
          // Get the direct text node walker approach for more complete text
          // This gets ALL visible text from all nested elements
          const allParagraphs = contentArea.querySelectorAll('p');
          
          if (allParagraphs.length > 0) {
            let fullResponseText = [];
            
            allParagraphs.forEach(paragraph => {
              // Get all spans with the content class
              const contentSpans = paragraph.querySelectorAll('span.font-ligatures-none');
              
              contentSpans.forEach(span => {
                // Get text from this span and all its children
                let spanText = "";
                
                // Traverse all child nodes and collect text
                const walker = document.createTreeWalker(
                  span,
                  NodeFilter.SHOW_TEXT,
                  null,
                  false
                );
                
                let node;
                while (node = walker.nextNode()) {
                  const text = node.textContent.trim();
                  if (text.length > 0) {
                    spanText += text + " ";
                  }
                }
                
                if (spanText.trim().length > 0) {
                  fullResponseText.push(spanText.trim());
                }
              });
            });
            
            // Join all text
            let combinedText = fullResponseText.join(" ").trim();
            
            // Clean up multiple spaces
            combinedText = combinedText.replace(/\s+/g, " ");
            
            // Wait for response to stabilize (stop growing)
            // If the response length hasn't changed in 2 iterations, it's complete
            if (combinedText.length === lastResponseLength && combinedText.length > 50) {
              noChangeCount++;
              if (noChangeCount >= 2) {
                console.log("[Copilot Helper] Full extracted response (length:", combinedText.length, "):", combinedText);
                clearInterval(checkForResponse);
                resolve(combinedText);
                return;
              }
            } else {
              noChangeCount = 0;
              lastResponseLength = combinedText.length;
            }
          }
        }
      }
    }, 800); // Increased interval to 800ms to wait longer
  });
}
