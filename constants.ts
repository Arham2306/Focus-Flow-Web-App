import { ColumnId, Task, TaskStatus, TaskPriority } from "./types";

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Project brainstorming with the UI team',
    status: TaskStatus.TODO,
    isImportant: false,
    columnId: ColumnId.TODAY,
    dueDate: 'Due today',
    categoryIcon: 'event',
    priority: TaskPriority.HIGH
  },
  {
    id: '2',
    title: 'Send weekly design report',
    status: TaskStatus.TODO,
    isImportant: true,
    columnId: ColumnId.TODAY,
    category: 'Work',
    categoryIcon: 'work',
    priority: TaskPriority.MEDIUM
  },
  {
    id: '3',
    title: 'Pick up groceries for dinner',
    status: TaskStatus.TODO,
    isImportant: false,
    columnId: ColumnId.UPCOMING,
    category: 'Personal',
    categoryIcon: 'shopping_cart',
    hasNotification: true,
    priority: TaskPriority.LOW
  },
  {
    id: '4',
    title: 'Morning meditation',
    status: TaskStatus.COMPLETED,
    isImportant: false,
    columnId: ColumnId.COMPLETED,
    category: 'Completed',
    categoryIcon: 'check',
    priority: TaskPriority.MEDIUM
  }
];

export const NAV_ITEMS = [
  { icon: 'dashboard', label: 'My Day', id: 'my-day' },
  { icon: 'star', label: 'Important', id: 'important' },
  { icon: 'calendar_month', label: 'Planned', id: 'planned' },
  { icon: 'home', label: 'Tasks', id: 'tasks' },
  { icon: 'check_circle', label: 'Completed', id: 'completed' },
];