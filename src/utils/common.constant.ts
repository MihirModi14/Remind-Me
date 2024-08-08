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
};
