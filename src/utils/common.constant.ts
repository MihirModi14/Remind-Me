export const TABS = {
  EVENTS: "events",
  OPTIONS: "options",
};

export const MEETING_ACTION = {
  NEW_TAB: 1,
  NOTIFICATION: 2,
  NOTHING: 3,
};

export const DEFAULT_OPTIONS = {
  showAllMeeting: false,
  includeOptional: false,
  meetingAction: MEETING_ACTION.NEW_TAB,
  executeBefore: 0,
  fetchDuration: 1,
};

export const MESSAGING_TASK = {
  SYNC_EVENTS: "sync_events",
  OPTION_UPDATE: "options_updated",
  UPDATE_ALARM: "update_alarm",
  UPDATE_EVENTS: "update_events",
};
