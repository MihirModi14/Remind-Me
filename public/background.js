const DEFAULT_OPTIONS = {
  showAllMeeting: false,
  includeOptional: false,
};

// Event listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  fetchAuthTokenAndEvents();
  setUpAlarms();
});

// Event listener for when the browser starts up
chrome.runtime.onStartup.addListener(() => {
  fetchAuthTokenAndEvents();
  setUpAlarms();
});

// Function to set up periodic alarms
const setUpAlarms = () => {
  chrome.alarms.clear("fetchEvents");
  chrome.alarms.create("fetchEvents", { periodInMinutes: 1 });
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
    fetchUserInfo();
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

const getUserInfo = async () => {
  return fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization:
        "Bearer " + (await chrome.storage.local.get("token")).token,
    },
  });
};

const fetchUserInfo = () => {
  getUserInfo()
    .then((response) => response.json())
    .then((data) => {
      chrome.storage.local.set({ email: data.email });
    });
};

// Function to fetch events from Google Calendar API
const fetchEvents = () => {
  getEventList()
    .then((response) => response.json())
    .then((response) => handleEventListResponse(response.items))
    .catch((error) => console.error("Error fetching events:", error));
};

const handleEventListResponse = async (eventList) => {
  const myEmail = (await chrome.storage.local.get("email")).email;
  const options = (await chrome.storage.local.get("options")).options;
  const showAllMeeting =
    options?.showAllMeeting || DEFAULT_OPTIONS.showAllMeeting;
  const includeOptional =
    options?.includeOptional || DEFAULT_OPTIONS.includeOptional;

  const todayEvents = sortEvents(
    eventList.filter((item) => isDateToday(item?.start?.dateTime))
  );
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
  scheduleTask("meeting", nextEvents?.[0]?.start?.dateTime);
  chrome.storage.local.set({
    events: showAllMeeting ? updatedTodayEvents : nextEvents,
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
      const eventList = (await chrome.storage.local.get("events")).events;
      createTab(eventList[0]?.hangoutLink);
      handleEventListResponse(eventList);
      break;
    case "fetchEvents":
      console.log("fetchAuthTokenAndEvents function called", new Date());
      fetchAuthTokenAndEvents();
      break;
  }
});

// Function to create a new tab with retries
function createTab(url, retryCount = 0) {
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
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.from === "options_update") {
    fetchEvents();
  }
  sendResponse({ status: "events updated" });
});
