import { FormControl, MenuItem, Select, Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { DEFAULT_OPTIONS, MEETING_ACTION } from "../../utils";
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

  const setOptionsToStorage = (options: any) => {
    chrome.storage.local.set({
      options: options,
    });

    chrome.runtime.sendMessage({ task: "sync_events" }, () => {
      console.log("Data Updated data");
    });
  };

  const updateOptions = (key: string, value: boolean | string | number) => {
    setOptions((options) => {
      const updatedOptions = {
        ...options,
        [key]: value,
      };
      setOptionsToStorage(updatedOptions);
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
          <p>Show past events</p>
          <Switch
            id="showAllMeeting"
            checked={options.showAllMeeting}
            onChange={(e) =>
              updateOptions(e.target.id, Boolean(e.target.checked))
            }
          />
        </li>
        <li>
          <p>Show optional meetings</p>
          <Switch
            id="includeOptional"
            checked={options.includeOptional}
            onChange={(e) =>
              updateOptions(e.target.id, Boolean(e.target.checked))
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
                updateOptions(e.target.name, Number(e.target.value))
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
      </ul>
    </div>
  );
};

export default Options;
