// Listen for extension button click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // First check if the content script is already injected
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_MOUNT' });
    // If we get here, the content script is already injected
  } catch (e) {
    // Content script is not injected yet, inject it
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }

  // Send mount message after ensuring content script is loaded
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id!, { type: 'MOUNT_APP' });
  }, 100); // Small delay to ensure content script is ready
});
