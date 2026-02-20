export enum TaskStatus {
  TODO = 'TODO',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ColumnId {
  TODAY = 'TODAY',
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED'
}

export enum SortOption {
  CREATION = 'CREATION',
  PRIORITY = 'PRIORITY',
  DUE_DATE = 'DUE_DATE',
  TITLE = 'TITLE'
}

export interface ColumnData {
  id: string;
  title: string;
  colorClass: string;
  sortBy?: SortOption;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  isImportant: boolean;
  columnId: string;
  category?: string; // e.g., 'Work', 'Personal'
  dueDate?: string;  // e.g., 'Due today'
  categoryIcon?: string; // Material symbol name
  hasNotification?: boolean;
  subtasks?: Subtask[];
  description?: string;
  priority?: TaskPriority;
  completedDate?: string; // ISO string
  previousColumnId?: string;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING'
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
  link?: string;
  action?: {
    label: string;
    onClick: string; // Action identifier
    payload?: any;
  };
}
