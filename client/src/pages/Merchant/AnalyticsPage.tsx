/**
 * Merchant Analytics Page
 *
 * Extended analytics page with:
 * - Date range filters
 * - Period comparison
 * - KPI cards with change indicators
 * - Revenue over time chart
 * - Revenue by product type chart
 * - Top categories chart
 * - Peak hours heatmap
 * - Export functionality (CSV/PDF)
 *
 * Protected route - requires merchant role
 */

import { useState, useMemo } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '@/hooks/useMerchantAnalytics';
import { MerchantSidebar } from './components';
import { DateRangeFilter } from './components/DateRangeFilter';
import { KPICardsWithChange } from './components/KPICardsWithChange';
import { AnalyticsRevenueChart } from './components/AnalyticsRevenueChart';
import { RevenueByProductTypeChart } from './components/RevenueByProductTypeChart';
import { TopCategoriesChart } from './components/TopCategoriesChart';
import { PeakHoursHeatmap } from './components/PeakHoursHeatmap';
import { ExportButtons } from './components/ExportButtons';
import './AnalyticsPage.css';

export const AnalyticsPage = () => {
  const { t } = useTranslation('merchant');

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [compareEnabled, setCompareEnabled] = useState(false);

  // Convert dates to ISO strings for API
  const queryParams = useMemo(
    () => ({
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      compare: compareEnabled,
    }),
    [startDate, endDate, compareEnabled]
  );

  const { data, isLoading, error } = useAnalytics(queryParams);

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">{t('analytics.loading', 'Loading analytics...')}</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <Container className="py-5">
                <Alert variant="danger">
                  <Alert.Heading>{t('analytics.error', 'Error')}</Alert.Heading>
                  <p className="mb-0">
                    {error instanceof Error ? error.message : t('analytics.errorMessage', 'Failed to load analytics')}
                  </p>
                </Alert>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="merchant-layout">
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={2} className="p-0">
            <MerchantSidebar />
          </Col>

          {/* Main Content */}
          <Col md={10} className="analytics-content">
            <Container fluid className="py-4">
              {/* Page Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h2 className="fw-bold">{t('analytics.title', 'Analytics')}</h2>
                  <p className="text-muted mb-0">
                    {data?.periodStart && data?.periodEnd
                      ? t('analytics.periodInfo', `Period: ${data.periodStart} to ${data.periodEnd}`)
                      : t('analytics.selectPeriod', 'Select a period to view analytics')}
                  </p>
                </div>
                <ExportButtons data={data} isLoading={isLoading} />
              </div>

              {/* Date Range Filter */}
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
                compareEnabled={compareEnabled}
                onCompareChange={setCompareEnabled}
              />

              {data ? (
                <>
                  {/* KPI Cards */}
                  <KPICardsWithChange data={data.kpi} showChange={compareEnabled} />

                  {/* Charts Row 1: Revenue + Product Type */}
                  <Row className="g-3 mb-4">
                    <Col lg={8}>
                      <AnalyticsRevenueChart
                        data={data.revenueByDay}
                        showComparison={compareEnabled}
                      />
                    </Col>
                    <Col lg={4}>
                      <RevenueByProductTypeChart data={data.revenueByProductType} />
                    </Col>
                  </Row>

                  {/* Charts Row 2: Categories + Peak Hours */}
                  <Row className="g-3 mb-4">
                    <Col lg={6}>
                      <TopCategoriesChart data={data.topCategories} />
                    </Col>
                    <Col lg={6}>
                      <PeakHoursHeatmap data={data.ordersByHour} />
                    </Col>
                  </Row>
                </>
              ) : (
                <Alert variant="info">
                  <p className="mb-0">{t('analytics.noData', 'No data available for the selected period')}</p>
                </Alert>
              )}
            </Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
