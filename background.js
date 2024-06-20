chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "webSched",
      title: "WebSched: Schedule this page",
      contexts: ["page"]
    });
    console.log('Context menu created'); // Debug log
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "webSched") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'capturePageInfo') {
      chrome.storage.local.get({ schedules: [] }, (result) => {
        const schedules = result.schedules;
        const newSchedule = {
          url: message.data.url,
          title: message.data.title,
          time: new Date().toISOString(), // Default to current time
          category: "work-related" // Default category
        };
        schedules.push(newSchedule);
        chrome.storage.local.set({ schedules }, () => {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'WebSched',
            message: 'Page scheduled for review.'
          });
        });
      });
    } else if (message.action === 'updateSchedule') {
      chrome.storage.local.get({ schedules: [] }, (result) => {
        const schedules = result.schedules;
        schedules[message.index] = message.schedule;
        chrome.storage.local.set({ schedules }, () => {
          // Set an alarm for the updated schedule
          const alarmName = `webSched_${message.index}`;
          chrome.alarms.clear(alarmName, () => {
            chrome.alarms.create(alarmName, { when: new Date(message.schedule.time).getTime() });
          });
        });
      });
    }
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.local.get({ schedules: [] }, (result) => {
      const schedules = result.schedules;
      const index = parseInt(alarm.name.split('_')[1]);
      const schedule = schedules[index];
      if (schedule) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'WebSched Reminder',
          message: `Time to review: ${schedule.title}`
        });
        chrome.tabs.create({ url: schedule.url });
        schedules.splice(index, 1); // Remove the schedule once it's notified
        chrome.storage.local.set({ schedules });
      }
    });
  });
  