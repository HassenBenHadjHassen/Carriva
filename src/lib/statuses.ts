export const STATUSES = [
  { value: "Draft",     label: "Draft",       color: "bg-secondary text-secondary-foreground" },
  { value: "Applied",  label: "Applied",      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "Interview",label: "Interview",    color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  { value: "Offer",    label: "Offer",        color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { value: "Rejected", label: "Rejected",     color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  { value: "Archived", label: "Archived",     color: "bg-muted text-muted-foreground" },
] as const;

export type AppStatus = typeof STATUSES[number]["value"];
