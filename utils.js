export async function getActiveTabURL() {
    const tabs = await chrome.tabs.query(
        {currentWindow: true, active: true}
    );

    return tabs[0]; // this is a tab object
}

/* 
! - What `chrome.tabs.query()` does:
- Takes: An object containing filter criteria (properties that describe what kind of tabs you want)
- Returns: A Promise that resolves to an array of tab objects that match your criteria

! Available Filter Attributes:

 Window-related filters:
```javascript
{
  currentWindow: true,     // Tabs in the current window
  lastFocusedWindow: true, // Tabs in the most recently focused window
  windowId: 123,           // Tabs in a specific window (takes a number - the window's ID)
  windowType: "normal"     // Window type: "normal", "popup", "panel", "app", "devtools"
}
```

Tab state filters:
```javascript
{
  active: true,           // The currently selected/visible tab
  highlighted: true,      // Tabs that are selected (can be multiple)
  pinned: true,          // Pinned tabs only
  audible: true,         // Tabs currently playing audio
  muted: false,          // Non-muted tabs
  discarded: false       // Tabs that haven't been automatically discarded to save memory
}
```

URL-based filters:
```javascript
{
  url: "https://youtube.com/*",     // Tabs matching URL pattern
  title: "YouTube"                  // Tabs with specific title (exact match)
}
```

Index-based filters:
```javascript
{
  index: 0               // Tab at specific position (0 is first tab)
}
```

! Practical Examples:

**Get all YouTube tabs:**
```javascript
const youtubeTabs = await chrome.tabs.query({
    url: "https://*.youtube.com/*"
});
```

**Get all pinned tabs in current window:**
```javascript
const pinnedTabs = await chrome.tabs.query({
    currentWindow: true,
    pinned: true
});
```

**Get all tabs playing audio:**
```javascript
const audioTabs = await chrome.tabs.query({
    audible: true
});
```

**Combine multiple filters:**
```javascript
const specificTabs = await chrome.tabs.query({
    currentWindow: true,
    active: false,        // All tabs EXCEPT the active one
    url: "https://*.google.com/*"
});
```
*/