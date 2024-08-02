import { useState } from "react";

import { TABS } from "./utils/common.constant";
import { Events, Header, Options } from "./components";
import "./App.css";

function App() {
  // State Variables
  const [activeTab, setActiveTab] = useState<string>(TABS.EVENTS);

  // JSX
  return (
    <main className="container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <section>{activeTab === TABS.EVENTS ? <Events /> : <Options />}</section>
    </main>
  );
}

export default App;
