# Todo Notification System

## Overview

The notification system provides real-time alerts when new tasks are assigned to users. When a user has unread todos, a red dot appears on the "Todo List" button in the sidebar.

## Features

- **Real-time notifications**: Red dot appears on the Todo List button when there are unread todos
- **Automatic marking as read**: Todos are marked as read when the user visits the Todo List page
- **Persistent tracking**: Uses localStorage to track when users last visited the todo list
- **Smart filtering**: Only shows todos created after the user's last visit (or last 7 days for new users)

## How it works

1. **Notification Detection**: The system checks for unread todos every 30 seconds
2. **Visual Indicator**: A red dot appears on the Todo List button when there are unread todos
3. **Mark as Read**: When a user visits the Todo List page, all todos are marked as read
4. **Persistent State**: The last visit time is stored in localStorage per user

## Components

### NotificationContext (`src/contexts/NotificationContext.tsx`)
- Manages the global notification state
- Handles polling for new todos
- Provides methods to refresh and mark todos as read

### NavLink (`src/components/layout/NavLink.tsx`)
- Displays the red notification dot on the Todo List button
- Uses the notification context to check for unread todos

### TodoList Page (`src/pages/TodoList.tsx`)
- Automatically marks todos as read when visited
- Integrates with the notification system

## Testing

A test component is available on the Dashboard page that allows users to:
- Create test todos assigned to themselves
- See the current unread count
- Verify the notification system works

## Database Integration

The system uses the existing `todos` table and adds:
- `getUnreadTodosCount()`: Fetches count of unread todos for a user
- `markTodosAsRead()`: Updates the user's last visit time

## Configuration

- **Polling interval**: 30 seconds (configurable in NotificationContext)
- **Default unread period**: 7 days for new users
- **Storage key**: `todo_last_visit_{userEmail}` in localStorage

## Usage

1. When a todo is created and assigned to a user, the notification system will detect it
2. The red dot will appear on the Todo List button in the sidebar
3. When the user clicks on the Todo List button, the todos are marked as read
4. The red dot disappears once all todos are read

## Future Enhancements

- Email notifications for urgent todos
- Push notifications for mobile devices
- Customizable notification preferences
- Notification history and management 