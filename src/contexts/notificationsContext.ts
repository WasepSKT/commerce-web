import React, { createContext, useContext } from 'react';

export type OrderChangeListener = (payload: unknown) => void;

export type NotificationsContextValue = {
  /**
   * Register a listener for order changes.
   * If `userId` is provided, the listener will only be invoked for events
   * where the changed record's `user_id` matches. If omitted, listener
   * receives all order change notifications.
   */
  onOrderChange: (listener: OrderChangeListener, userId?: string) => void;
  /**
   * Unregister a previously registered listener. If the listener was
   * registered with a `userId`, pass the same `userId` to remove it from
   * the per-user mapping; otherwise it removes from the global listeners.
   */
  offOrderChange: (listener: OrderChangeListener, userId?: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const useNotifications = () => {
  return useContext(NotificationsContext);
};

export default NotificationsContext;
