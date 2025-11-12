import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Nav, Card } from 'react-bootstrap';
import { IoNotifications } from 'react-icons/io5';
import { useNotificationStore, NotificationType } from '../../store/notificationStore';
import { NotificationItem } from '../../components/notifications';
import { Navbar, Footer } from '../../components/layout';
import './NotificationsPage.css';

type TabType = 'all' | 'unread' | 'orders' | 'system';

export function NotificationsPage() {
  const {
    notifications,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    isLoading,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadNotificationsForTab(activeTab, currentPage);
  }, [activeTab, currentPage]);

  const loadNotificationsForTab = async (tab: TabType, page: number) => {
    const params: any = { page, limit: ITEMS_PER_PAGE };

    switch (tab) {
      case 'unread':
        params.unread = true;
        break;
      case 'orders':
        params.type = NotificationType.ORDER_UPDATE;
        break;
      case 'system':
        params.type = NotificationType.PROMO;
        break;
      default:
        break;
    }

    await loadNotifications(params);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    loadNotificationsForTab(activeTab, currentPage);
  };

  const filteredNotifications = React.useMemo(() => {
    let filtered = [...notifications];

    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter((n) => !n.is_read);
        break;
      case 'orders':
        filtered = filtered.filter(
          (n) =>
            n.type === NotificationType.ORDER_UPDATE ||
            n.type === NotificationType.PAYMENT_SUCCESS ||
            n.type === NotificationType.SHIPPING_UPDATE ||
            n.type === NotificationType.BOOKING_REMINDER
        );
        break;
      case 'system':
        filtered = filtered.filter((n) => n.type === NotificationType.PROMO);
        break;
      default:
        break;
    }

    return filtered;
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Navbar />
      <div className="notifications-page">
        <Container className="py-4">
          {/* Header */}
          <div className="notifications-header mb-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-2">
                  <IoNotifications className="me-2" />
                  Notifications
                </h1>
                <p className="text-muted mb-0">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline-primary" size="sm" onClick={handleMarkAllAsRead}>
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Nav variant="tabs" className="mb-4" activeKey={activeTab}>
            <Nav.Item>
              <Nav.Link
                eventKey="all"
                onClick={() => handleTabChange('all')}
                className={activeTab === 'all' ? 'active' : ''}
              >
                All
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="unread"
                onClick={() => handleTabChange('unread')}
                className={activeTab === 'unread' ? 'active' : ''}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="badge bg-danger ms-2">{unreadCount}</span>
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="orders"
                onClick={() => handleTabChange('orders')}
                className={activeTab === 'orders' ? 'active' : ''}
              >
                Orders
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="system"
                onClick={() => handleTabChange('system')}
                className={activeTab === 'system' ? 'active' : ''}
              >
                System
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Notifications List */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <IoNotifications size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No notifications yet</h5>
                <p className="text-muted mb-0">
                  {activeTab === 'unread'
                    ? "You're all caught up!"
                    : 'Notifications will appear here'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredNotifications.length > 0 && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="me-2"
              >
                Previous
              </Button>
              <span className="align-self-center mx-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}

export default NotificationsPage;
