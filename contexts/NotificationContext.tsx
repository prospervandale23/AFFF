import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  clearBadge: () => void;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const userIdRef = useRef<string | null>(null);

  // Sync with system app icon badge
  useEffect(() => {
    Notifications.setBadgeCountAsync(unreadCount);
  }, [unreadCount]);

  async function fetchUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', userId)
        .is('read_at', null);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (e) {
      console.error('fetchUnreadCount error:', e);
    }
  }

  function refreshUnreadCount() {
    if (userIdRef.current) fetchUnreadCount(userIdRef.current);
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;

      const userId = session.user.id;
      userIdRef.current = userId;
      fetchUnreadCount(userId);

      // Only listen for new incoming messages — no UPDATE listener to avoid loops
      channel = supabase
        .channel('notification-badge')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=neq.${userId}`,
          },
          () => fetchUnreadCount(userId)
        )
        .subscribe();
    });

    // Re-fetch accurate count whenever app comes back to foreground
    // (this handles read_at updates that happened inside conversation screens)
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userIdRef.current) {
        fetchUnreadCount(userIdRef.current);
      }
    });

    // Handle sign-in / sign-out
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        userIdRef.current = session.user.id;
        fetchUnreadCount(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        setUnreadCount(0);
      }
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      appStateSub.remove();
      authSub.unsubscribe();
    };
  }, []);

  const clearBadge = () => {
    // Re-fetch truth from DB rather than blindly zeroing out —
    // user may have only read some conversations, others still unread
    if (userIdRef.current) fetchUnreadCount(userIdRef.current);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, clearBadge, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};