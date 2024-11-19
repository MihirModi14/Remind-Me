import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import { MESSAGING_TASK, TABS } from "../../utils";
import style from "./Header.module.scss";

type HeaderProps = {
  activeTab: string;
  setActiveTab: (activeTab: string) => void;
};

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  // State Variables
  const [rotate, setRotate] = useState(0);

  // Page Events
  const onClickRefresh = () => {
    chrome.runtime.sendMessage({ task: MESSAGING_TASK.SYNC_EVENTS }, () => {
      console.log("refresh done");
      setRotate((prevRotate) => prevRotate + 360);
    });
  };

  return (
    <header className={style.header}>
      <ToggleButtonGroup
        value={activeTab}
        exclusive
        onChange={(e: any) => setActiveTab(e.target.value)}
      >
        <ToggleButton value={TABS.EVENTS}>Events</ToggleButton>
        <ToggleButton value={TABS.OPTIONS}>Options</ToggleButton>
      </ToggleButtonGroup>
      {activeTab === TABS.EVENTS && (
        <a onClick={onClickRefresh}>
          <img
            style={{
              transform: `rotate(${rotate}deg)`,
              transition: "transform 0.3s ease",
            }}
            src="./assets/refresh.svg"
            alt="refresh"
          />
        </a>
      )}
    </header>
  );
};

export default Header;
