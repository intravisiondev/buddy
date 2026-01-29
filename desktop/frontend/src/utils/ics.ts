type ScheduleBlock = {
  id: string;
  study_plan_id: string;
  day_of_week: number; // 0=Sun
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  subject: string;
  topic?: string;
  block_type: string;
};

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toICSDateTimeLocal(d: Date) {
  // floating local time: YYYYMMDDTHHMMSS
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function nextOccurrence(dayOfWeek: number, hhmm: string) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const now = new Date();
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setHours(hh ?? 0, mm ?? 0, 0, 0);

  const currentDow = d.getDay(); // 0=Sun
  let delta = (dayOfWeek - currentDow + 7) % 7;
  if (delta === 0 && d <= now) delta = 7; // next week if time already passed today
  d.setDate(d.getDate() + delta);
  return d;
}

export function buildScheduleICS(blocks: ScheduleBlock[], calendarName = 'Buddy Study Schedule') {
  const now = new Date();
  const dtstamp = toICSDateTimeLocal(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Buddy//StudySchedule//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${calendarName}`,
  ];

  for (const b of blocks) {
    const start = nextOccurrence(b.day_of_week, b.start_time);
    const end = nextOccurrence(b.day_of_week, b.end_time);
    // If end time is earlier than start time (rare), push end to next day
    if (end <= start) end.setDate(end.getDate() + 1);

    const summary = `${b.subject}${b.block_type ? ` (${b.block_type})` : ''}`;
    const description = b.topic ? `Topic: ${b.topic}` : '';
    const uid = `${b.id}@buddy`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toICSDateTimeLocal(start)}`,
      `DTEND:${toICSDateTimeLocal(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[b.day_of_week] ?? 'MO'}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : undefined,
      'END:VEVENT',
    );
  }

  // filter undefineds
  const out = lines.filter(Boolean) as string[];
  out.push('END:VCALENDAR');

  // iCalendar requires CRLF
  return out.join('\r\n') + '\r\n';
}

