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
    // Capture the page information from the context menu click
    const pageInfo = {
      title: tab.title,
      url: info.pageUrl
    };

    chrome.storage.local.get({ schedules: [], categories: ['work-related', 'leisure'] }, (result) => {
      const schedules = result.schedules;
      const categories = result.categories;
      const newSchedule = {
        url: pageInfo.url,
        title: pageInfo.title,
        time: new Date().toISOString(), // Default to current time
        category: "work-related" // Default category
      };

      // Check if the page is already scheduled to prevent duplicates
      const isAlreadyScheduled = schedules.some(schedule => schedule.url === newSchedule.url);
      if (!isAlreadyScheduled) {
        schedules.push(newSchedule);
        chrome.storage.local.set({ schedules }, () => {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'WebSched',
            message: 'Page scheduled for review.'
          });
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateSchedule') {
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
