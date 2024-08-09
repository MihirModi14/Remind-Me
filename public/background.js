const MEETING_ACTION = {
  NEW_TAB: 1,
  NOTIFICATION: 2,
  NOTHING: 3,
};

const DEFAULT_OPTIONS = {
  showAllMeeting: false,
  includeOptional: false,
  meetingAction: MEETING_ACTION.NEW_TAB,
  executeBefore: 0,
  fetchDuration: 1,
};

const MESSAGING_TASK = {
  SYNC_EVENTS: "sync_events",
  OPTION_UPDATE: "options_updated",
  UPDATE_ALARM: "update_alarm",
  UPDATE_EVENTS: "update_events",
};

// Event listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  fetchAuthTokenAndEvents();
  const options = (await chrome.storage.local.get("options")).options;
  const fetchDuration = options?.fetchDuration || DEFAULT_OPTIONS.fetchDuration;
  setUpAlarms(fetchDuration);
});

// Event listener for when the browser starts up
chrome.runtime.onStartup.addListener(async () => {
  fetchAuthTokenAndEvents();
  const options = (await chrome.storage.local.get("options")).options;
  const fetchDuration = options?.fetchDuration || DEFAULT_OPTIONS.fetchDuration;
  setUpAlarms(fetchDuration);
});

// Function to set up periodic alarms
const setUpAlarms = (periodInHour) => {
  const periodInMinutes = periodInHour * 60;
  chrome.alarms.clear("fetchEvents");
  chrome.alarms.create("fetchEvents", { periodInMinutes: periodInMinutes });
};

// Function to fetch authentication token and events
const fetchAuthTokenAndEvents = () => {
  chrome.identity.getAuthToken({ interactive: true }, async (token) => {
    if (chrome.runtime.lastError || !token) {
      console.error("Failed to get token:", chrome.runtime.lastError);
      return;
    }
    await chrome.storage.local.set({ token });
    fetchEvents();
  });
};

const getEventList = async () => {
  return fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      headers: {
        Authorization:
          "Bearer " + (await chrome.storage.local.get("token")).token,
      },
    }
  );
};

// Function to fetch events from Google Calendar API
const fetchEvents = () => {
  getEventList()
    .then((response) => response.json())
    .then((response) => handleEventListResponse(response))
    .catch((error) => console.error("Error fetching events:", error));
};

const handleEventListResponse = async (response) => {
  const eventList = response.items || [];
  const myEmail = response.summary;
  const options = (await chrome.storage.local.get("options")).options;
  const showAllMeeting =
    options?.showAllMeeting || DEFAULT_OPTIONS.showAllMeeting;
  const includeOptional =
    options?.includeOptional || DEFAULT_OPTIONS.includeOptional;
  const executeBefore = options?.executeBefore || DEFAULT_OPTIONS.executeBefore;
  const isExecuteBeforeZero = executeBefore === 0;

  const sortedEventList = sortEvents(
    eventList.filter((item) => isDateToday(item?.start?.dateTime))
  );
  const todayEvents = isExecuteBeforeZero
    ? sortedEventList
    : sortedEventList.map((event) => ({
        ...event,
        start: {
          ...event.start,
          executionTime: decreaseTimeByMinutes(
            event?.start?.dateTime,
            executeBefore
          ),
        },
      }));
  const updatedTodayEvents = includeOptional
    ? todayEvents
    : todayEvents.filter(
        (event) =>
          !event.attendees ||
          event.attendees.some(
            (attendee) => attendee.email === myEmail && !attendee.optional
          )
      );
  const nextEvents = removePastEvents(updatedTodayEvents);
  scheduleTask(
    "meeting",
    isExecuteBeforeZero
      ? nextEvents?.[0]?.start?.dateTime
      : nextEvents?.[0]?.start?.executionTime
  );
  chrome.storage.local.set({
    eventsInfo: {
      ...response,
      events: showAllMeeting ? updatedTodayEvents : nextEvents,
    },
  });
  chrome.runtime.sendMessage({ task: MESSAGING_TASK.UPDATE_EVENTS }, () => {
    if (chrome.runtime.lastError) {
      console.log("popup is closed");
    } else {
      console.log("refresh done");
    }
  });
};

// Utility function to check if a meeting is scheduled for today
const isDateToday = (date) => {
  if (!date) return false;
  const meetingDate = new Date(date);
  const today = new Date();
  return (
    meetingDate.getUTCFullYear() === today.getUTCFullYear() &&
    meetingDate.getUTCMonth() === today.getUTCMonth() &&
    meetingDate.getUTCDate() === today.getUTCDate()
  );
};

// Utility function to sort date-time list in IST
const sortEvents = (dateTimeList) => {
  return dateTimeList.sort((a, b) => {
    const dateA = toISTDate(a?.start?.dateTime);
    const dateB = toISTDate(b?.start?.dateTime);
    return dateA - dateB;
  });
};

// Utility function to convert date-time to IST
const toISTDate = (dateTimeString) => {
  const date = new Date(dateTimeString);
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + IST_OFFSET);
};

// Utility function to decrease date-time by given minutes
function decreaseTimeByMinutes(dateTime, minutes) {
  let date = new Date(dateTime);
  date.setMinutes(date.getMinutes() - minutes);
  let adjustedDateTime =
    dateTime.slice(0, 10) + "T" + date.toTimeString().slice(0, 8);

  return adjustedDateTime;
}

// Utility function to remove past times from date-time list
const removePastEvents = (dateTimeList) => {
  const now = new Date();
  return dateTimeList.filter((item) => {
    const date = new Date(item?.start?.dateTime);
    return date >= now;
  });
};

// Function to schedule a task using alarms
const scheduleTask = (taskName, dateTime) => {
  if (!dateTime) {
    console.log("You don't have any pending meetings today!!");
    chrome.alarms.clear(taskName);
    return;
  }
  const now = new Date();
  const scheduledTime = new Date(dateTime);
  const delayInMinutes = (scheduledTime - now) / 1000 / 60;

  if (delayInMinutes > 0) {
    chrome.alarms.clear(taskName);
    chrome.alarms.create(taskName, { delayInMinutes });
    console.log(`Scheduled meeting at ${scheduledTime}`);
  } else {
    console.log("Scheduled time is in the past. Please select a future time.");
  }
};

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case "meeting":
      const eventsInfo = (await chrome.storage.local.get("eventsInfo"))
        ?.eventsInfo;
      const eventList = eventsInfo?.events;
      const options = (await chrome.storage.local.get("options"))?.options;

      if (!eventList[0]?.hangoutLink) {
        const isExecuteBeforeZero = options.executeBefore === 0;
        createNotification(
          "Meeting Reminder",
          `You have a "${eventList[0].summary}" meeting ${
            isExecuteBeforeZero
              ? "now"
              : `in ${options.executeBefore} minute`
          }`,
          false
        );
      } else {
        switch (options?.meetingAction || DEFAULT_OPTIONS.meetingAction) {
          case MEETING_ACTION.NEW_TAB:
            createTab(eventList[0]?.hangoutLink);
            break;
          case MEETING_ACTION.NOTIFICATION:
            const isExecuteBeforeZero = options.executeBefore === 0;
            createNotification(
              "Meeting Reminder",
              `You have a "${eventList[0].summary}" meeting ${
                isExecuteBeforeZero
                  ? "now"
                  : `in ${options.executeBefore} minute`
              }`,
              true
            );
            await chrome.storage.local.set({
              meetLink: eventList[0].hangoutLink,
            });
            break;
        }
      }
      handleEventListResponse(eventsInfo);
      break;
    case "fetchEvents":
      console.log("fetchAuthTokenAndEvents function called", new Date());
      fetchAuthTokenAndEvents();
      break;
  }
});

// Function to create a new tab with retries
const createTab = (url, retryCount = 0) => {
  chrome.tabs.create({ url: url }, () => {
    if (chrome.runtime.lastError) {
      console.log(
        `Failed to create tab. Retrying... (${chrome.runtime.lastError.message})`
      );
      setTimeout(() => {
        createTab(url, retryCount + 1);
      }, Math.pow(2, retryCount) * 100);
    } else {
      console.log("New tab created");
    }
  });
};

const createNotification = (title, message, showButton) => {
  const options = {
    type: "basic",
    iconUrl: "./assets/meeting.jpeg",
    title: title,
    message: message,
    buttons: showButton ? [{ title: "Join Meeting" }] : [],
  };

  chrome.notifications.create("notify", options, (notificationId) => {
    console.log("Notification created: ", notificationId);
  });
};

chrome.notifications.onButtonClicked.addListener(async () => {
  const meetLink = (await chrome.storage.local.get("meetLink")).meetLink;
  createTab(meetLink);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.task === MESSAGING_TASK.SYNC_EVENTS) {
    fetchEvents();
  }
  if (message.task === MESSAGING_TASK.UPDATE_ALARM) {
    const fetchDuration =
      message.options.fetchDuration || DEFAULT_OPTIONS.fetchDuration;
    setUpAlarms(fetchDuration);
  }
  sendResponse({ status: "events updated" });
});
