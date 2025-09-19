(() => {
    let youtubeLeftControls, youtubePlayer; // Will be undefined initially
    let currentVideo = "";
    let currentVideoBookmarks = [];
    // They'll be assigned actual DOM elements later when the code finds YouTube's controls,
    // they are not global because the (() => {}) wrapper creates a private scope.

    const fetchBookmarks = () => {
        //! Returns and creates a Promise
        //! Promise takes a function as argument 
        //! The function takes resolve as argument 

        // Promise(executor function) returns a Promise object containing your result
        // The executor function receives a resolve parameter
        // resolve parameter is itself a function 

        return new Promise((resolve) => {

            //! chrome.storage.sync.get receives:
            //! arg1: array of keys to look up, arg2: a callback function to execute when storage lookup is done
            //! So when the lookup is done chrome.storage.sync.get calls resolve with "obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []" as parameter 
            //! resolve takes a value as a parameter 
            //! "obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []" is a value that is either JSON.parse(obj[currentVideo]) or an empty array []
            //! basically if obj[currentVideo] exists then parse it, otherwise return an empty array

            // What JSON.parse() does:
            // Input: A JSON string like '[{"time":30,"desc":"Cool part"}]'
            // Output: A JavaScript array/object like [{time:30, desc:"Cool part"}]

            chrome.storage.sync.get([currentVideo], (obj) => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
            });
        });
    };

    const addNewBookmarkEventHandler = async () => {
        //! This will trigger at the click 
        const currentTime = youtubePlayer.currentTime; 
        const newBookmark = {
            time: currentTime,
            desc: "Bookmark at " + getTime(currentTime),
        };
        
        currentVideoBookmarks = await fetchBookmarks();

        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
            // The three dots are the spread operator
            // Without spread: [...currentVideoBookmarks, newBookmark] creates [[bookmark1, bookmark2], newBookmark]
            // With spread operator [...currentVideoBookmarks, newBookmark] creates [bookmark1, bookmark2, newBookmark]
            // Example with real data:
            // Input values:
            // currentVideo = "dQw4w9WgXcQ"
            // currentVideoBookmarks = [{ time: 30, desc: "Intro" }, { time: 120, desc: "Main topic" }]
            // newBookmark = { time: 60, desc: "Important point" }

            // Step by step:
            // Spread and add: [{time: 30, desc: "Intro"}, {time: 120, desc: "Main topic"}, {time: 60, desc: "Important point"}]
            // Sort by time: [{time: 30, desc: "Intro"}, {time: 60, desc: "Important point"}, {time: 120, desc: "Main topic"}]
            // JSON.stringify: '[{"time":30,"desc":"Intro"},{"time":60,"desc":"Important point"},{"time":120,"desc":"Main topic"}]'
            // Final object passed to storage:
            // {
            //     "dQw4w9WgXcQ": '[{"time":30,"desc":"Intro"},{"time":60,"desc":"Important point"},{"time":120,"desc":"Main topic"}]'
            // }
        });
    };

    const newVideoLoaded = async () => {
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0]; 
        //! We look if we already have the clickable img
        // document.getElementsByClassName(className)
        // Takes: string (CSS class name)
        // Returns: HTMLCollection (array-like object of elements with that class),
        // It returns a list of elements that implement that class, so we took the first - notice it's getElement(s)
        // document.getElementsByClassName("ytp-play-button ytp-button") will return something like this:
        //  HTMLCollection
        //  ├── [0] → <button class="ytp-play-button ytp-button"> … </button>
        //  ├── [1] → <button class="ytp-play-button ytp-button"> … </button>
        //  ├── [2] → <button class="ytp-play-button ytp-button"> … </button>
        //  └── length: 3
        
        currentVideoBookmarks = await fetchBookmarks();
        //! We retrieve the bookmarks for the current video

        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img"); 
            // document.createElement(tagName)  
            // Takes: string (HTML tag name like "img", "div")
            // Returns: HTMLElement (new DOM element). 

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png"); 
            // There are standard attributes (like src, className, title), but bookmarkBtn.random = "random" works too!

            bookmarkBtn.className = "ytp-button " + "bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current timestamp";

            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];
            
            youtubeLeftControls.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler); 
            // addEventListener is a method available on all DOM elements.
            // What it takes:
            // Argument 1: String (event type like "click", "mouseover", "keydown")
            // Argument 2: Function (callback that runs when event happens)
            // Optional Argument 3: Options object (for advanced configuration)

            // What it does: Registers a function to run when a specific event occurs on that element.
            // How it works:
            // Browser adds your function to the element's event listener list
            // When user clicks, browser calls your function
            // Browser passes an Event object to your function (though you're not using it)
        }
    };

    chrome.runtime.onMessage.addListener((obj, sender, response) => { 
        // obj is what's been sent, sender and response are generated automatically 
        const { type, value, videoId } = obj; 
        
        // Here value was never sent from background so it's undefined, value = null
        // I thought there was an equivalence between that line and:
        // const { type, videoId } = obj; 
        // let value; 
        // Version 1: value is const (cannot be reassigned)
        // Version 2: value is let (can be reassigned)

        //! If the obj has been sent by background.js then tab is updated and info you will get is 
        //! type = "NEW" and videoId only, and value = null

        if (type === "NEW") { //! Logically, this would trigger only when tab is updated 
            currentVideo = videoId; // currentVideo wasn't defined like youtubeLeftControls, a bug maybe 
            // When not declared, variables become global (unless it's strict mode then it throws an error)
            newVideoLoaded();
        } else if (type === "PLAY") {
            youtubePlayer.currentTime = value;
        } else if (type === "DELETE") {
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
            response(currentVideoBookmarks);
        }
    });

    newVideoLoaded();
})();

const getTime = t => {
    var date = new Date(0);      // Creates date at Unix epoch (1970-01-01 00:00:00)
    date.setSeconds(t);          // Adds 't' seconds to that base time

    return date.toISOString().substr(11, 8); // Extract clean HH:MM:SS format
    
    /* Example breakdown:
     * If t = 125 seconds:
     * - New Date(0) = "1970-01-01T00:00:00.000Z"
     * - setSeconds(125) = "1970-01-01T00:02:05.000Z"
     * - substr(11, 8) extracts 8 characters starting at position 11 = "00:02:05"
     * 
     * Position mapping:
     * "1970-01-01T00:02:05.000Z"
     *            ↑       ↑
     *         pos 11  pos 19 (11+8)
     * 
     * substr(start, length) vs substr(start, end):
     * - substr(11, 8) means: start at position 11, take 8 characters
     * - NOT positions 11-18, but 8 characters total: positions 11-18 inclusive
     */
};