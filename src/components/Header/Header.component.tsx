import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { TABS } from "../../utils";

import style from "./Header.module.scss";

const Header = ({ activeTab, setActiveTab }: any) => {
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
      <a onClick={() => console.log("Update Meeting")}>
        <img src="./assets/refresh.svg" alt="refresh" />
      </a>
    </header>
  );
};

export default Header;