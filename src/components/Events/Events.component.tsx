import { useEffect, useState } from "react";
import { MESSAGING_TASK, formatTimeTo12Hour } from "../../utils";

import style from "./Events.module.scss";

const Events = () => {
  // State Variables
  const [eventList, setEventList] = useState<any[]>([]);
  const noPendingEvents = eventList.length === 0;

  // Hooks
  useEffect(() => {
    getEventList();
  }, []);

  // Helper Methods
  const getEventList = () => {
    chrome.storage.local
      .get("events")
      .then((events: any) => setEventList(events.events));
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.task === MESSAGING_TASK.UPDATE_EVENTS) {
      console.log(sender);
      getEventList();
      return sendResponse({});
    }
  });

  return (
    <div className={style.events}>
      <ul>
        {eventList.map((event) => {
          return (
            <a key={event.id} href={event.hangoutLink} target="_blank">
              <div className={style.meetingInfo}>
                <p title={event.summary}>{event.summary}</p>
                <span>
                  {formatTimeTo12Hour(event.start.dateTime)} -{" "}
                  {formatTimeTo12Hour(event.end.dateTime)}
                </span>
              </div>
              {event.description && (
                <div className={style.description}>{event.description}</div>
              )}
            </a>
          );
        })}
      </ul>
      {noPendingEvents && (
        <div className={style.noDataFound}>
          You don't have any pending meetings.
        </div>
      )}
    </div>
  );
};

export default Events;
