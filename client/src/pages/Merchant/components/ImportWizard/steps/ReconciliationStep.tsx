/**
 * Reconciliation Step
 *
 * Review and approve import items before execution.
 * Shows stats, allows filtering, and resolving conflicts.
 */

import { useEffect, useState } from 'react';
import { Table, Button, Badge, Spinner, Pagination, ButtonGroup } from 'react-bootstrap';
import {
  useImportStats,
  useImportItems,
  useImportItemsTotal,
  useImportItemsPage,
  useImportItemsFilter,
  useImportIsLoadingItems,
  useLoadImportItems,
  useApproveAllImportItems,
  useResolveImportConflict,
  useExecuteImport,
} from '@/store/importStore';
import type { ImportItemStatus, ImportItem } from '@/api/import-export.api';

const STATUS_BADGES: Record<ImportItemStatus, { bg: string; label: string }> = {
  pending: { bg: 'secondary', label: 'Pending' },
  matched: { bg: 'info', label: 'Matched' },
  new: { bg: 'primary', label: 'New' },
  conflict: { bg: 'warning', label: 'Conflict' },
  approved: { bg: 'success', label: 'Approved' },
  rejected: { bg: 'dark', label: 'Rejected' },
  imported: { bg: 'success', label: 'Imported' },
  error: { bg: 'danger', label: 'Error' },
};

const ITEMS_PER_PAGE = 20;

export const ReconciliationStep = () => {
  const stats = useImportStats();
  const items = useImportItems();
  const total = useImportItemsTotal();
  const currentPage = useImportItemsPage();
  const currentFilter = useImportItemsFilter();
  const isLoading = useImportIsLoadingItems();

  const loadItems = useLoadImportItems();
  const approveAll = useApproveAllImportItems();
  const resolveConflict = useResolveImportConflict();
  const executeImport = useExecuteImport();

  const [isApproving, setIsApproving] = useState(false);

  // Load items on mount
  useEffect(() => {
    loadItems(1, null);
  }, [loadItems]);

  const handleFilterChange = (status: ImportItemStatus | null) => {
    loadItems(1, status);
  };

  const handlePageChange = (page: number) => {
    loadItems(page, currentFilter);
  };

  const handleApproveAll = async (statuses?: ImportItemStatus[]) => {
    try {
      setIsApproving(true);
      await approveAll(statuses);
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleResolveConflict = async (
    itemId: string,
    action: 'update' | 'skip' | 'insert'
  ) => {
    try {
      await resolveConflict(itemId, action);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const handleExecute = async () => {
    try {
      await executeImport();
    } catch (error) {
      console.error('Failed to execute import:', error);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const getProductTitle = (item: ImportItem): string => {
    if (item.mapped_data?.product?.title) {
      return String(item.mapped_data.product.title);
    }
    // Fallback to raw data
    const titleKeys = ['title', 'name', 'Title', 'Name', 'Название'];
    for (const key of titleKeys) {
      if (item.raw_data[key]) {
        return item.raw_data[key];
      }
    }
    return `Row ${item.row_number}`;
  };

  const getSku = (item: ImportItem): string => {
    if (item.mapped_data?.variant?.sku) {
      return String(item.mapped_data.variant.sku);
    }
    const skuKeys = ['sku', 'SKU', 'vendorCode', 'Артикул'];
    for (const key of skuKeys) {
      if (item.raw_data[key]) {
        return item.raw_data[key];
      }
    }
    return '-';
  };

  const renderChanges = (item: ImportItem) => {
    if (!item.changes || item.changes.length === 0) return null;

    return (
      <div className="item-changes">
        {item.changes.slice(0, 3).map((change, idx) => (
          <div key={idx} className="change-item">
            <span className="text-muted">{change.field.split('.')[1]}:</span>
            <span className="old-value">{String(change.old_value ?? '-')}</span>
            <i className="bi bi-arrow-right mx-1"></i>
            <span className="new-value">{String(change.new_value ?? '-')}</span>
          </div>
        ))}
        {item.changes.length > 3 && (
          <small className="text-muted">+{item.changes.length - 3} more</small>
        )}
      </div>
    );
  };

  const renderConflictActions = (item: ImportItem) => {
    if (item.status !== 'conflict') return null;

    return (
      <ButtonGroup size="sm">
        <Button
          variant="outline-success"
          onClick={() => handleResolveConflict(item.id, 'update')}
          title="Update existing product"
        >
          <i className="bi bi-pencil"></i>
        </Button>
        <Button
          variant="outline-primary"
          onClick={() => handleResolveConflict(item.id, 'insert')}
          title="Create as new"
        >
          <i className="bi bi-plus"></i>
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => handleResolveConflict(item.id, 'skip')}
          title="Skip this item"
        >
          <i className="bi bi-x"></i>
        </Button>
      </ButtonGroup>
    );
  };

  const canExecute =
    stats &&
    (stats.matched > 0 || stats.new > 0) &&
    stats.conflicts === 0 &&
    stats.pending === 0;

  return (
    <div className="reconciliation-step">
      {/* Stats */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{stats.matched}</div>
            <div className="stat-label">Matched</div>
          </div>
          <div className="stat-card info">
            <div className="stat-value">{stats.new}</div>
            <div className="stat-label">New</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{stats.conflicts}</div>
            <div className="stat-label">Conflicts</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-value">{stats.errors}</div>
            <div className="stat-label">Errors</div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <Button
          variant={currentFilter === null ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => handleFilterChange(null)}
        >
          All ({stats?.total || 0})
        </Button>
        <Button
          variant={currentFilter === 'matched' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => handleFilterChange('matched')}
        >
          Matched ({stats?.matched || 0})
        </Button>
        <Button
          variant={currentFilter === 'new' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => handleFilterChange('new')}
        >
          New ({stats?.new || 0})
        </Button>
        <Button
          variant={currentFilter === 'conflict' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => handleFilterChange('conflict')}
        >
          Conflicts ({stats?.conflicts || 0})
        </Button>
        <Button
          variant={currentFilter === 'error' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => handleFilterChange('error')}
        >
          Errors ({stats?.errors || 0})
        </Button>
      </div>

      {/* Actions Bar */}
      <div className="reconciliation-actions">
        <div>
          <strong>{total}</strong> items
          {currentFilter && <span className="text-muted"> (filtered)</span>}
        </div>
        <div className="action-buttons">
          <Button
            variant="outline-success"
            size="sm"
            onClick={() => handleApproveAll(['matched', 'new'])}
            disabled={isApproving || !stats || (stats.matched === 0 && stats.new === 0)}
          >
            {isApproving ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : (
              <>
                <i className="bi bi-check-all me-1"></i>
                Approve All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
          <p className="mt-2">No items found</p>
        </div>
      ) : (
        <>
          <Table responsive hover className="items-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Title</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Action</th>
                <th>Changes</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="text-muted">{item.row_number}</td>
                  <td>
                    <strong>{getProductTitle(item)}</strong>
                    {item.error_message && (
                      <div className="text-danger small">{item.error_message}</div>
                    )}
                  </td>
                  <td>
                    <code>{getSku(item)}</code>
                  </td>
                  <td>
                    <Badge
                      bg={STATUS_BADGES[item.status]?.bg || 'secondary'}
                      className="item-status-badge"
                    >
                      {STATUS_BADGES[item.status]?.label || item.status}
                    </Badge>
                    {item.matched_by && (
                      <div className="text-muted small">by {item.matched_by}</div>
                    )}
                  </td>
                  <td>
                    <Badge
                      bg={
                        item.action === 'insert'
                          ? 'success'
                          : item.action === 'update'
                            ? 'info'
                            : 'secondary'
                      }
                    >
                      {item.action}
                    </Badge>
                  </td>
                  <td>{renderChanges(item)}</td>
                  <td>{renderConflictActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  const pageNum = Math.max(1, currentPage - 2) + idx;
                  if (pageNum > totalPages) return null;
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Execute Button */}
      <div className="mt-4 text-center">
        {stats && stats.conflicts > 0 && (
          <div className="alert alert-warning mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please resolve all conflicts before importing.
          </div>
        )}
        <Button
          variant="success"
          size="lg"
          onClick={handleExecute}
          disabled={!canExecute}
        >
          <i className="bi bi-play-fill me-2"></i>
          Execute Import ({(stats?.matched || 0) + (stats?.new || 0)} items)
        </Button>
      </div>
    </div>
  );
};

export default ReconciliationStep;
