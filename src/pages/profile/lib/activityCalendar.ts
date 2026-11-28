export interface DayActivity {
  date: string;
  count: number;
}

export interface CalendarCell {
  date: string;
  count: number;
  level: number;
  linkDown: boolean;
  linkRight: boolean;
}

export interface MonthLabel {
  label: string;
  column: number;
}

export interface ActivityCalendar {
  weeks: (CalendarCell | null)[][];
  months: MonthLabel[];
  total: number;
}

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
const WEEKS = 53;

export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

export function activityLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) {
    return 0;
  }
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

export function buildCalendar(today: Date, days: DayActivity[]): ActivityCalendar {
  const counts: Record<string, number> = {};
  for (const day of days) {
    counts[day.date] = (counts[day.date] ?? 0) + day.count;
  }

  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const shiftToMonday = (end.getDay() + 6) % 7;
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - shiftToMonday);
  start.setDate(start.getDate() - (WEEKS - 1) * 7);

  const cells: (CalendarCell | null)[][] = [];
  const months: MonthLabel[] = [];
  let max = 0;
  let total = 0;
  let lastMonth = -1;

  for (let week = 0; week < WEEKS; week++) {
    const column: (CalendarCell | null)[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + week * 7 + weekday,
      );
      if (date > end) {
        column.push(null);
        continue;
      }
      const key = dateKey(date);
      const count = counts[key] ?? 0;
      max = Math.max(max, count);
      total = total + count;
      column.push({ date: key, count: count, level: 0, linkDown: false, linkRight: false });
      if (date.getMonth() !== lastMonth && date.getDate() <= 7) {
        lastMonth = date.getMonth();
        months.push({ label: MONTHS[lastMonth], column: week });
      }
    }
    cells.push(column);
  }

  for (const column of cells) {
    for (const cell of column) {
      if (cell !== null) {
        cell.level = activityLevel(cell.count, max);
      }
    }
  }

  for (let week = 0; week < cells.length; week++) {
    for (let day = 0; day < 7; day++) {
      const cell = cells[week][day];
      if (cell === null || cell.level === 0) {
        continue;
      }
      const below = day < 6 ? cells[week][day + 1] : null;
      const right = week < cells.length - 1 ? cells[week + 1][day] : null;
      cell.linkDown = below !== null && below.level > 0;
      cell.linkRight = right !== null && right.level > 0;
    }
  }

  return { weeks: cells, months: months, total: total };
}

export function solutionsWord(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return "решений";
  }
  if (last === 1) {
    return "решение";
  }
  if (last >= 2 && last <= 4) {
    return "решения";
  }
  return "решений";
}

const WEEKDAY_NAMES = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

export function cellTitle(cell: CalendarCell): string {
  const parts = cell.date.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const day =
    WEEKDAY_NAMES[date.getDay()] + ", " + date.getDate() + " " + MONTHS_GENITIVE[date.getMonth()];
  if (cell.count === 0) {
    return "Нет решений · " + day;
  }
  return cell.count + " " + solutionsWord(cell.count) + " · " + day;
}
