import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { DEFAULT_OPTIONS } from "../../utils";
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

    chrome.runtime.sendMessage({ from: "options_update" }, () => {
      console.log("Data Updated data");
    });
  };

  const updateOptions = (key: string, value: boolean | string) => {
    setOptions((options) => {
      const updatedOptions = {
        ...options,
        [key]: value,
      };
      setOptionsToStorage(updatedOptions);
      return updatedOptions;
    });
  };

  return (
    <div className={styled.options}>
      <ul>
        <li>
          <p>Show all events</p>
          <Switch
            id="showAllMeeting"
            checked={options.showAllMeeting}
            onChange={(e) =>
              updateOptions(e.target.id, Boolean(e.target.checked))
            }
          />
        </li>
        <li>
          <p>Show meeting where I am optional</p>
          <Switch
            id="includeOptional"
            checked={options.includeOptional}
            onChange={(e) =>
              updateOptions(e.target.id, Boolean(e.target.checked))
            }
          />
        </li>
      </ul>
    </div>
  );
};

export default Options;
