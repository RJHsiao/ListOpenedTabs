// added from "chrome tab count"

function updateIcon(tabId, changeInfo, tab) {
    chrome.tabs.query({currentWindow: true},
    // chrome.tabs.query({},
        function(tabs){

            var ntabs = tabs.length;

            var ntabs_str = ntabs.toString();
		    chrome.browserAction.setBadgeText({text: ntabs_str});
        });
}

chrome.tabs.onCreated.addListener(updateIcon);
chrome.tabs.onRemoved.addListener(updateIcon);
chrome.tabs.onReplaced.addListener(updateIcon);
chrome.windows.onFocusChanged.addListener(updateIcon);

updateIcon();
