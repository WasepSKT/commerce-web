import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationsContext, { OrderChangeListener } from '@/contexts/notificationsContext';

type NormalizedOrderPayload = {
  new: Record<string, unknown> | null;
  raw: unknown;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // global listeners (receive all events)
  const globalListenersRef = useRef(new Set<OrderChangeListener>());
  // per-user listeners map: userId -> Set<listener>
  const perUserListenersRef = useRef(new Map<string, Set<OrderChangeListener>>());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // single global subscription for orders realtime changes
    const scheduleNotify = (rawPayload: unknown) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      // normalize payload so consumers have a predictable shape
      const normalized: NormalizedOrderPayload = (() => {
        try {
          const p = rawPayload as Record<string, unknown> | null;
          const record = p?.new ?? p?.record ?? p?.payload ?? null;
          return { new: (record as Record<string, unknown>) ?? null, raw: rawPayload };
        } catch (e) {
          return { new: null, raw: rawPayload };
        }
      })();

      timerRef.current = window.setTimeout(() => {
        try {
          // call global listeners
          globalListenersRef.current.forEach((l) => {
            try { l(normalized); } catch (e) { console.error('notify listener error', e); }
          });

          // if we can extract a user_id, only notify listeners registered for that user
          const maybeRecord = normalized.new as Record<string, unknown> | null;
          const userId = maybeRecord && typeof maybeRecord === 'object' ? (maybeRecord['user_id'] ?? maybeRecord['userId']) : null;
          if (typeof userId === 'string') {
            const set = perUserListenersRef.current.get(userId);
            if (set) {
              set.forEach((l) => {
                try { l(normalized); } catch (e) { console.error('notify per-user listener error', e); }
              });
            }
          }
        } finally {
          timerRef.current = null;
        }
      }, 500) as unknown as number;
    };

    const subscription = supabase
      .channel('global-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        scheduleNotify(payload);
      })
      .subscribe();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      try { subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, []);

  const onOrderChange = (listener: OrderChangeListener, userId?: string) => {
    if (userId) {
      const map = perUserListenersRef.current;
      let set = map.get(userId);
      if (!set) {
        set = new Set<OrderChangeListener>();
        map.set(userId, set);
      }
      set.add(listener);
    } else {
      globalListenersRef.current.add(listener);
    }
  };

  const offOrderChange = (listener: OrderChangeListener, userId?: string) => {
    if (userId) {
      const map = perUserListenersRef.current;
      const set = map.get(userId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) map.delete(userId);
      }
    } else {
      globalListenersRef.current.delete(listener);
    }
  };

  return (
    <NotificationsContext.Provider value={{ onOrderChange, offOrderChange }}>
      {children}
    </NotificationsContext.Provider>
  );
};

