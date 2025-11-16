import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { IoNotifications, IoCheckmarkCircle, IoRocket, IoCart, IoGift } from 'react-icons/io5';
import { NotificationType } from '../../store/notificationStore';
import type { Notification } from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  compact?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ORDER_UPDATE:
      return <IoCart style={{ color: '#0d6efd' }} size={32} />;
    case NotificationType.PAYMENT_SUCCESS:
      return <IoCheckmarkCircle style={{ color: '#198754' }} size={32} />;
    case NotificationType.SHIPPING_UPDATE:
      return <IoRocket style={{ color: '#6f42c1' }} size={32} />;
    case NotificationType.BOOKING_REMINDER:
      return <IoNotifications style={{ color: '#fd7e14' }} size={32} />;
    case NotificationType.PROMO:
      return <IoGift style={{ color: '#d63384' }} size={32} />;
    default:
      return <IoNotifications style={{ color: '#6c757d' }} size={32} />;
  }
};

const getNotificationBadgeVariant = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ORDER_UPDATE:
      return 'primary';
    case NotificationType.PAYMENT_SUCCESS:
      return 'success';
    case NotificationType.SHIPPING_UPDATE:
      return 'info';
    case NotificationType.BOOKING_REMINDER:
      return 'warning';
    case NotificationType.PROMO:
      return 'danger';
    default:
      return 'secondary';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  compact = false,
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const cardContent = (
    <Card
      className={`mb-3 notification-item ${!notification.is_read ? 'notification-unread' : ''}`}
      style={{ cursor: onClick || notification.related_url ? 'pointer' : 'default' }}
      onClick={() => onClick?.(notification)}
    >
      <Card.Body>
        <Row className="align-items-start g-3">
          {/* Icon */}
          <Col xs="auto">
            <div className="notification-icon-container">
              {getNotificationIcon(notification.type)}
            </div>
          </Col>

          {/* Content */}
          <Col>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="mb-0 fw-bold">{notification.title}</h6>
              {!notification.is_read && (
                <Badge bg="primary" className="ms-2">New</Badge>
              )}
            </div>
            <p className="mb-2 text-muted">{notification.message}</p>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">{timeAgo}</small>
              <Badge bg={getNotificationBadgeVariant(notification.type)} pill>
                {notification.type.replace('_', ' ')}
              </Badge>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  if (notification.related_url) {
    return (
      <Link to={notification.related_url} className="text-decoration-none">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};
