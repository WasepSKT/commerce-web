import React, { createContext, useContext } from 'react';

export type OrderChangeListener = (payload: unknown) => void;

export type NotificationsContextValue = {
  onOrderChange: (listener: OrderChangeListener) => void;
  offOrderChange: (listener: OrderChangeListener) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const useNotifications = () => {
  return useContext(NotificationsContext);
};

export default NotificationsContext;
