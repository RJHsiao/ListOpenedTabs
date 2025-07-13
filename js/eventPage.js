// added from "chrome tab count"

async function updateIcon() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabCountStr = tabs.length.toString();
    await chrome.action.setBadgeText({ text: tabCountStr });
}

chrome.tabs.onCreated.addListener(updateIcon);
chrome.tabs.onRemoved.addListener(updateIcon);
chrome.tabs.onReplaced.addListener(updateIcon);
chrome.windows.onFocusChanged.addListener(updateIcon);

updateIcon();
