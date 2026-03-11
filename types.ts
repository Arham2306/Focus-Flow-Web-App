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

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export interface WorkspaceMember {
  uid: string;
  role: WorkspaceRole;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: Record<string, WorkspaceMember>;
  memberIds: string[];
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  inviterId?: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ColumnData {
  id: string;
  title: string;
  colorClass: string;
  sortBy?: SortOption;
  workspaceId?: string;
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
  workspaceId?: string; // Optional for backward compatibility before migration
  subtasks?: Subtask[];
  description?: string;
  priority?: TaskPriority;
  completedDate?: string; // ISO string
  previousColumnId?: string;
  dueDateISO?: string; // Original full timestamp
  dueDateKey?: string; // YYYY-MM-DD for stable calendar mapping
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

export interface PomodoroSession {
  id: string;
  date: string; // ISO string 
  durationMinutes: number;
  mode: 'focus' | 'break';
}
