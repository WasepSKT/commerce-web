import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationsContext, { OrderChangeListener } from '@/contexts/notificationsContext';

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listenersRef = useRef(new Set<OrderChangeListener>());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // single global subscription for orders realtime changes
    const scheduleNotify = (payload: unknown) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        // call all listeners with payload
        listenersRef.current.forEach((l) => {
          try { l(payload); } catch (e) { console.error('notify listener error', e); }
        });
        timerRef.current = null;
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

  const onOrderChange = (listener: OrderChangeListener) => {
    listenersRef.current.add(listener);
  };

  const offOrderChange = (listener: OrderChangeListener) => {
    listenersRef.current.delete(listener);
  };

  return (
    <NotificationsContext.Provider value={{ onOrderChange, offOrderChange }}>
      {children}
    </NotificationsContext.Provider>
  );
};

