import React from 'react';
import { Link } from 'react-router-dom';
import { IoNotifications, IoCheckmarkCircle, IoRocket, IoCart, IoGift } from 'react-icons/io5';
import { Notification, NotificationType } from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  compact?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ORDER_UPDATE:
      return <IoCart className="text-blue-500" size={20} />;
    case NotificationType.PAYMENT_SUCCESS:
      return <IoCheckmarkCircle className="text-green-500" size={20} />;
    case NotificationType.SHIPPING_UPDATE:
      return <IoRocket className="text-purple-500" size={20} />;
    case NotificationType.BOOKING_REMINDER:
      return <IoNotifications className="text-orange-500" size={20} />;
    case NotificationType.PROMO:
      return <IoGift className="text-pink-500" size={20} />;
    default:
      return <IoNotifications className="text-gray-500" size={20} />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  compact = false,
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const content = (
    <div
      className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-blue-50' : ''
      } ${compact ? 'border-b' : 'rounded-lg border mb-2'}`}
      onClick={() => onClick?.(notification)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{notification.title}</h4>
          {!notification.is_read && (
            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
          )}
        </div>
        <p className={`text-sm text-gray-600 mt-1 ${compact ? 'line-clamp-2' : ''}`}>
          {notification.message}
        </p>
        <span className="text-xs text-gray-500 mt-2 block">{timeAgo}</span>
      </div>
    </div>
  );

  if (notification.related_url) {
    return (
      <Link to={notification.related_url} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
