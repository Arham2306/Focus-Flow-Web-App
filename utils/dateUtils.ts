const MONTH_LOOKUP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDate = (year: number, monthIndex: number, day: number): boolean => {
  const date = new Date(year, monthIndex, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === monthIndex &&
    date.getDate() === day
  );
};

const normalizeYear = (rawYear?: string): number => {
  if (!rawYear) return new Date().getFullYear();
  if (rawYear.length === 2) return 2000 + Number(rawYear);
  return Number(rawYear);
};

export const parseDueDateToKey = (dueDate?: string): string | undefined => {
  if (!dueDate) return undefined;

  const cleaned = dueDate.trim().replace(/^due\s+/i, '');
  if (!cleaned) return undefined;

  const lower = cleaned.toLowerCase();
  const today = new Date();

  if (lower.includes('today')) return formatDateKey(today);
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateKey(tomorrow);
  }

  const monthDayMatch = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{2,4}))?.*$/);
  if (monthDayMatch) {
    const monthToken = monthDayMatch[1].slice(0, 3).toLowerCase();
    const monthIndex = MONTH_LOOKUP[monthToken];
    const day = Number(monthDayMatch[2]);
    const year = normalizeYear(monthDayMatch[3]);
    if (
      monthIndex !== undefined &&
      Number.isInteger(day) &&
      Number.isInteger(year) &&
      isValidDate(year, monthIndex, day)
    ) {
      return formatDateKey(new Date(year, monthIndex, day));
    }
  }

  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?.*$/);
  if (slashMatch) {
    const month = Number(slashMatch[1]);
    const day = Number(slashMatch[2]);
    const year = normalizeYear(slashMatch[3]);
    const monthIndex = month - 1;
    if (
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      Number.isInteger(year) &&
      isValidDate(year, monthIndex, day)
    ) {
      return formatDateKey(new Date(year, monthIndex, day));
    }
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateKey(parsed);
  }

  return undefined;
};
