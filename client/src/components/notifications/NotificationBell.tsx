import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsBell } from 'react-icons/bs';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount, getUnreadCount } = useNotificationStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    getUnreadCount();

    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      getUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [getUnreadCount, isAuthenticated]);

  const handleClick = () => {
    navigate('/notifications');
  };

  // Don't render notification bell for guests
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="notification-icon-wrapper" onClick={handleClick}>
      <BsBell className="notification-icon" />
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </div>
  );
};
