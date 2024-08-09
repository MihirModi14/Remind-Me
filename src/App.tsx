import { useState } from "react";

import { TABS } from "./utils/common.constant";
import { Events, Header, Options } from "./components";
import "./App.scss";

function App() {
  // State Variables
  const [activeTab, setActiveTab] = useState<string>(TABS.EVENTS);

  // JSX
  return (
    <main className="container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <section className={activeTab === TABS.EVENTS ? "" : "hide"}>
        {<Events />}
      </section>
      <section className={activeTab === TABS.OPTIONS ? "" : "hide"}>
        {<Options />}
      </section>
    </main>
  );
}

export default App;
