import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  clearBadge: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync with System App Icon Badge
  useEffect(() => {
    Notifications.setBadgeCountAsync(unreadCount);
  }, [unreadCount]);

  const clearBadge = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, clearBadge }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};