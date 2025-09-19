
//chrome.tabs.onUpdated.addListener (Background Script) runs as soon as the extension loads/installs
//Runs in the background, separate from any webpage

chrome.tabs.onUpdated.addListener((tabId, tab) => {
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      const queryParameters = tab.url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
      //! takes as a parameter a string containing URL params like "key1=value1&key2=value2&key3=value3" 
      //! it returns with methods like .get() .set() .has()
      //! RESULT : urlParameters.get("v") would get us the videoId

      console.log("URL Parameters:", urlParameters.toString());
  
      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        videoId: urlParameters.get("v"),
      });
    }
  });

