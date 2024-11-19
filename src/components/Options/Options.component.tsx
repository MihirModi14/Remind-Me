import {
  FormControl,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

import { DEFAULT_OPTIONS, MEETING_ACTION, MESSAGING_TASK } from "../../utils";
import styled from "./Options.module.scss";

const Options = () => {
  // State Variables
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  // Hooks
  useEffect(() => {
    getOptions();
  }, []);

  // Helper Methods
  const getOptions = async () => {
    const options = (await chrome.storage.local.get("options")).options;
    if (options) {
      setOptions(options);
    }
  };

  const setOptionsToStorage = (options: any, task: string) => {
    chrome.storage.local.set({
      options: options,
    });

    if (
      task === MESSAGING_TASK.SYNC_EVENTS ||
      task === MESSAGING_TASK.UPDATE_ALARM
    ) {
      chrome.runtime.sendMessage({ task: task }, () => {
        console.log("Data Updated data");
      });
    }
  };

  const updateOptions = (
    key: string,
    value: boolean | string | number,
    task: string
  ) => {
    setOptions((options) => {
      const updatedOptions = {
        ...options,
        [key]: value,
      };
      setOptionsToStorage(updatedOptions, task);
      return updatedOptions;
    });
  };

  const getActionValue = (selectedValue: number) => {
    if (selectedValue === MEETING_ACTION.NEW_TAB) return "new tab";
    if (selectedValue === MEETING_ACTION.NOTIFICATION) return "notification";
    return "nothing";
  };

  return (
    <div className={styled.options}>
      <ul>
        <li>
          <p>Show past meetings</p>
          <Switch
            id="showAllMeeting"
            checked={options.showAllMeeting}
            onChange={(e) =>
              updateOptions(
                e.target.id,
                Boolean(e.target.checked),
                MESSAGING_TASK.SYNC_EVENTS
              )
            }
          />
        </li>
        <li>
          <p>Show optional meetings</p>
          <Switch
            id="includeOptional"
            checked={options.includeOptional}
            onChange={(e) =>
              updateOptions(
                e.target.id,
                Boolean(e.target.checked),
                MESSAGING_TASK.SYNC_EVENTS
              )
            }
          />
        </li>
        <li>
          <p>Select an action for the meeting</p>
          <FormControl>
            <Select
              name="meetingAction"
              value={options.meetingAction}
              onChange={(e) =>
                updateOptions(
                  e.target.name,
                  Number(e.target.value),
                  MESSAGING_TASK.OPTION_UPDATE
                )
              }
              renderValue={(selectedValue) => getActionValue(selectedValue)}
            >
              <MenuItem value={MEETING_ACTION.NEW_TAB}>
                Open in New Tab
              </MenuItem>
              <MenuItem value={MEETING_ACTION.NOTIFICATION}>
                Send Notification
              </MenuItem>
              <MenuItem value={MEETING_ACTION.NOTHING}>Do Nothing</MenuItem>
            </Select>
          </FormControl>
        </li>
        {options.meetingAction !== MEETING_ACTION.NOTHING && (
          <li>
            <p>
              {options.meetingAction === MEETING_ACTION.NEW_TAB
                ? "Open meeting before"
                : "Show notification before"}
            </p>
            <TextField
              id="executeBefore"
              value={options.executeBefore}
              onChange={(e) =>
                updateOptions(
                  e.target.id,
                  Number(e.target.value),
                  MESSAGING_TASK.SYNC_EVENTS
                )
              }
              inputProps={{ min: 0, max: 60 }}
              type="number"
              variant="outlined"
            />
            <p>minutes</p>
          </li>
        )}
        <li>
          <p>Check for meetings at every</p>
          <TextField
            id="fetchDuration"
            value={options.fetchDuration}
            onChange={(e) =>
              updateOptions(
                e.target.id,
                Number(e.target.value),
                MESSAGING_TASK.UPDATE_ALARM
              )
            }
            inputProps={{ min: 1, max: 24 }}
            type="number"
            variant="outlined"
          />
          <p>hour</p>
        </li>
      </ul>
    </div>
  );
};

export default Options;
