// When it runs: Only when the user clicks the extension icon
// What it does: Sets up the popup interface and loads bookmarks

import { getActiveTabURL } from "./utils.js";

//flow
// 1. user clicks extension icon 
// 2. DOMContentLoaded fires and ignites viewBookmarks
// 3. viewbookmarks loads the html bookmarks elt , sets its innerHTML to "". then for each bookmark triggers addNewBookmark
// 4. addNewBookmark adds 3 elements (bookmarkTitleElement , controlsElement ,  newBookmarkElement)

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div"); //this doesn't manipulate the html /exists only in javascript memory because change happens only when there is append 
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement); // this should add bookmark child under bookmarksElement 
};

const viewBookmarks = (currentBookmarks=[]) => { // currentVideoBookmarks=[]  Provides a fallback value if no argument is passed.
    const bookmarksElement = document.getElementById("bookmarks");
    bookmarksElement.innerHTML =""; //empty it just in case 

    if (currentBookmarks.length > 0) {
        for (let i=0 ; i< currentBookmarks.length ; i++) {
            const bookmark = currentBookmarks[i];
            addNewBookmark(bookmarksElement , bookmark); 
        }
    } else {
        bookmarksElement.innerHTML ='<i class="row">No bookmarks to show</i>'; 
    }
    return;
};

const onPlay = async e => {
    const Bookmarktime = e.target.parentNode.parentNode.getAttribute("timestamp");
    // e.target is the html element that was clicked : meaning in this case it's <img title ='play' src='assets/play.png'>
    //.parentNode must be the controls elemenst , whihc is basically <div className='bookmark-controls'>
    //.parentNode again is newBookmarkElement which is <div id ='bookmark-1:30' , timestamp='10:20:20'> so this is what we are calling
    const activeTab = await getActiveTabURL();

    chrome.tabs.sendMessage(
        activeTab.id ,
         {type : "PLAY",value: Bookmarktime,}); // this sends message to the content script of the activeTab 
};

const onDelete = async e => {
    const activeTab = await getActiveTabURL();
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const bookmarkElementToDelete = document.getElementById(
        "bookmark-" + bookmarkTime
    );

    bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

    chrome.tabs.sendMessage(activeTab.id, {
        type: "DELETE",
        value: bookmarkTime,
    }, viewBookmarks);    //view bookmarks serves as a callback function. It will

    //! sendMessage takes as an argument (tabId , message(JSON-ifiable object) , object(optional..check docs))
};

const setBookmarkAttributes =  (src, eventListener, controlParentElement) => {
    const controlElement = document.createElement("img");
    controlElement.src = "assets/" + src + ".png";
    controlElement.title = src;
    controlElement.addEventListener("click" , eventListener);

    // the following is the main goal of this function 
    controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
    //we have to find the bookmarks for this video and show them 
    //first we need to get the id of the video
    const activeTab = await getActiveTabURL(); // this is a tab object 
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters =  new URLSearchParams(queryParameters);
    const currentVideo = urlParameters.get('v');
    // 2. fetch the storage for the bookmarks (if it's youtube)
    if(activeTab.url.includes("youtube.com/watch") && currentVideo)  {
        chrome.storage.sync.get([currentVideo] , (obj) => {
            const currentVideoBookmarks = obj[currentVideo] ? JSON.parse(obj[currentVideo]) : [];
            //3. add them in the html
            viewBookmarks(currentVideoBookmarks);
        });
    } else {
        // show it's not a youtube 
        const container = document.getElementsByClassName("container")[0];
        container.innerHTML ='<div class="title">This is not a youtube video page.</div>';
    }
});