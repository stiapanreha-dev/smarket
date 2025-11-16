import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsBell } from 'react-icons/bs';
import { useNotificationStore } from '../../store/notificationStore';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount, getUnreadCount } = useNotificationStore();

  useEffect(() => {
    getUnreadCount();

    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      getUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [getUnreadCount]);

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <div className="notification-icon-wrapper" onClick={handleClick}>
      <BsBell className="notification-icon" />
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </div>
  );
};
