const pageTitle = document.title;
const pageUrl = window.location.href;

chrome.runtime.sendMessage({
  action: 'capturePageInfo',
  data: {
    title: pageTitle,
    url: pageUrl
  }
});
