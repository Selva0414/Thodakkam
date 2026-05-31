export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'success' | 'alert';
  targetRole?: 'student' | 'startup' | 'admin';
}

class NotificationStore {
  notifications: Notification[] = [];
  listeners: (() => void)[] = [];

  addNotification(notification: Omit<Notification, 'id' | 'time'>) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      time: 'Just now',
    };
    this.notifications = [newNotification, ...this.notifications];
    this.notifyListeners();
  }

  getNotifications() {
    return this.notifications;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export const globalNotificationStore = new NotificationStore();
