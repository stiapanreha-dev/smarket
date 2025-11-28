/**
 * Notifications Section Component
 *
 * Embedded notifications view (without Navbar/Footer from NotificationsPage)
 */

import React, { useState, useEffect } from 'react';
import { Button, Nav, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaBell, FaCheck } from 'react-icons/fa';
import { useNotificationStore, NotificationType } from '@/store/notificationStore';
import { NotificationItem } from '@/components/notifications';

type TabType = 'all' | 'unread' | 'orders' | 'system';

export const NotificationsSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    notifications,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    isLoading,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadNotificationsForTab(activeTab, currentPage);
  }, [activeTab, currentPage]);

  const loadNotificationsForTab = async (tab: TabType, page: number) => {
    const params: Record<string, unknown> = { page, limit: ITEMS_PER_PAGE };

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

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await loadNotificationsForTab(activeTab, currentPage);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="section-header">
        <h2>{t('customer:notifications.title')}</h2>
        {unreadCount > 0 && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleMarkAllRead}
          >
            <FaCheck className="me-1" />
            {t('customer:notifications.markAllAsRead')}
          </Button>
        )}
      </div>

      <div className="section-content">
        {/* Tabs */}
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'all'}
              onClick={() => handleTabChange('all')}
            >
              {t('customer:notifications.tabs.all')}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'unread'}
              onClick={() => handleTabChange('unread')}
            >
              {t('customer:notifications.tabs.unread')} {unreadCount > 0 && `(${unreadCount})`}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'orders'}
              onClick={() => handleTabChange('orders')}
            >
              {t('customer:notifications.tabs.orders')}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'system'}
              onClick={() => handleTabChange('system')}
            >
              {t('customer:notifications.tabs.system')}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Content */}
        {isLoading ? (
          <div className="loading-spinner">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-state-icon" />
            <h3>{t('customer:notifications.noNotifications')}</h3>
            <p>
              {activeTab === 'unread'
                ? t('customer:notifications.allCaughtUp')
                : t('customer:notifications.noNotificationsYet')}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {notifications.length >= ITEMS_PER_PAGE && (
          <div className="d-flex justify-content-center mt-4 gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              {t('customer:common.previous')}
            </Button>
            <span className="d-flex align-items-center px-3">
              {t('customer:notifications.page', { page: currentPage })}
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              {t('customer:common.next')}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsSection;
