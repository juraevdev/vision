const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

function parseDay(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function parseTimestamp(value: string) {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = parseDay(value);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return `${date.getDate()}-${MONTHS[date.getMonth()]}${sameYear ? "" : `, ${date.getFullYear()}`}`;
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDay(value).getTime() - today.getTime()) / 86_400_000);
}

export function deadlineLabel(value: string | null | undefined) {
  const days = daysUntil(value);
  if (days === null) return "Muddat belgilanmagan";
  if (days < 0) return `${Math.abs(days)} kun kechikdi`;
  if (days === 0) return "Bugun tugaydi";
  if (days === 1) return "Ertaga tugaydi";
  return `${days} kun qoldi`;
}

export function timeAgo(value: string) {
  const seconds = Math.max(0, (Date.now() - parseTimestamp(value).getTime()) / 1000);
  if (seconds < 60) return "hozirgina";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "kecha";
  if (days < 7) return `${days} kun oldin`;
  return formatDate(parseTimestamp(value).toISOString());
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export const KIND_LABEL = { new: "Yangi", ongoing: "Joriy" } as const;

export const STATUS_LABEL = {
  todo: "Kutilmoqda",
  in_progress: "Jarayonda",
  done: "Bajarildi",
} as const;
