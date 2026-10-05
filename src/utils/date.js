// [Modified] QA-05: Every event happens on the Ann Arbor campus, so dates and times
// are always shown in campus time (America/Detroit). Before, they were formatted in each
// phone's own timezone. An event at 7:55 PM Tuesday in Ann Arbor (23:55 UTC) showed as
// Wednesday on a phone set to a timezone ahead of UTC. The phone's language and region still
// control how the text is written, but they no longer change the day or time.
export const EVENT_TIME_ZONE = 'America/Detroit';

// [Modified] QA-05: Formats the event's weekday, month, and day in campus time.
export function formatEventDate(startsAt) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(startsAt));
}

// [Modified] QA-05: Formats the start and end times in campus time. The end time
// includes the timezone abbreviation (for example "EDT") so it is clear which timezone is shown.
export function formatEventTime(startsAt, endsAt) {
  const startFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  });
  const endFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
    timeZoneName: 'short',
  });
  return `${startFormatter.format(new Date(startsAt))} - ${endFormatter.format(new Date(endsAt))}`;
}

export function formatFullEventDate(startsAt, endsAt) {
  return `${formatEventDate(startsAt)} · ${formatEventTime(startsAt, endsAt)}`;
}
