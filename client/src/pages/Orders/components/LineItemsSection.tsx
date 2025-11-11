import { Card, Table, Badge } from 'react-bootstrap';
import { Button } from '@/components/common/Button';
import {
  type Order,
  type OrderLineItem,
  type DigitalFulfillmentData,
  type ServiceFulfillmentData,
  LineItemType,
  DigitalItemStatus,
  formatLineItemPrice,
} from '@/types';
import { OrderStatusBadge } from '@/components/features/OrderStatusBadge';
import toast from 'react-hot-toast';

export interface LineItemsSectionProps {
  order: Order;
}

/**
 * LineItem Row Component
 */
function LineItemRow({ lineItem }: { lineItem: OrderLineItem }) {
  const itemTotal = formatLineItemPrice(lineItem);

  const handleDownload = () => {
    const data = lineItem.fulfillment_data as DigitalFulfillmentData;
    if (data?.download_url) {
      window.open(data.download_url, '_blank');
      toast.success('Download started!');
    } else {
      toast.error('Download URL not available');
    }
  };

  // Format variant attributes if present
  const variantText = lineItem.variant_attributes
    ? Object.entries(lineItem.variant_attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : null;

  return (
    <tr>
      {/* Product Image & Name */}
      <td>
        <div className="d-flex align-items-center">
          <div
            className="line-item-image me-3"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {lineItem.product?.images?.[0] ? (
              <img
                src={lineItem.product.images[0]}
                alt={lineItem.product_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span className="text-muted">📦</span>
            )}
          </div>
          <div>
            <div className="fw-semibold">{lineItem.product_name}</div>
            {lineItem.product_sku && (
              <div className="text-muted small">SKU: {lineItem.product_sku}</div>
            )}
            {variantText && (
              <div className="text-muted small">{variantText}</div>
            )}
            {/* Type Badge */}
            <Badge
              variant={
                lineItem.type === LineItemType.PHYSICAL
                  ? 'info'
                  : lineItem.type === LineItemType.DIGITAL
                  ? 'success'
                  : 'warning'
              }
              className="mt-1"
              pill
            >
              {lineItem.type}
            </Badge>
          </div>
        </div>
      </td>

      {/* Quantity */}
      <td className="text-center align-middle">
        <span className="fw-semibold">{lineItem.quantity}</span>
      </td>

      {/* Price */}
      <td className="text-end align-middle">
        <div className="fw-semibold">
          {lineItem.currency} {itemTotal.toFixed(2)}
        </div>
        <div className="text-muted small">
          {lineItem.currency} {(lineItem.unit_price / 100).toFixed(2)} each
        </div>
      </td>

      {/* Status & Actions */}
      <td className="align-middle">
        <div className="d-flex flex-column align-items-end gap-2">
          <OrderStatusBadge status={lineItem.status} size="sm" />

          {/* Digital Item Download Button */}
          {lineItem.type === LineItemType.DIGITAL &&
            lineItem.status === DigitalItemStatus.ACCESS_GRANTED && (
              <Button variant="outline-primary" size="sm" onClick={handleDownload}>
                Download
              </Button>
            )}

          {/* Service Item Booking Details */}
          {lineItem.type === LineItemType.SERVICE &&
            lineItem.fulfillment_data &&
            (lineItem.fulfillment_data as ServiceFulfillmentData).booking_date && (
              <div className="text-muted small text-end">
                <div>
                  <strong>Booking:</strong>
                </div>
                <div>{(lineItem.fulfillment_data as ServiceFulfillmentData).booking_date}</div>
                {(lineItem.fulfillment_data as ServiceFulfillmentData).booking_slot && (
                  <div>{(lineItem.fulfillment_data as ServiceFulfillmentData).booking_slot}</div>
                )}
                {(lineItem.fulfillment_data as ServiceFulfillmentData).location && (
                  <div>{(lineItem.fulfillment_data as ServiceFulfillmentData).location}</div>
                )}
              </div>
            )}
        </div>
      </td>
    </tr>
  );
}

/**
 * LineItemsSection Component
 *
 * Displays order line items with:
 * - Product image, name, and SKU
 * - Quantity and price
 * - Status badge
 * - Type-specific actions (download for digital, booking info for services)
 */
export function LineItemsSection({ order }: LineItemsSectionProps) {
  return (
    <Card className="line-items-section mb-4">
      <Card.Body>
        <h5 className="mb-3">Order Items</h5>

        {/* Desktop Table View */}
        <div className="d-none d-md-block">
          <Table responsive hover>
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-center">Quantity</th>
                <th className="text-end">Price</th>
                <th className="text-end">Status</th>
              </tr>
            </thead>
            <tbody>
              {order.line_items.map(lineItem => (
                <LineItemRow key={lineItem.id} lineItem={lineItem} />
              ))}
            </tbody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="d-md-none">
          {order.line_items.map(lineItem => {
            const itemTotal = formatLineItemPrice(lineItem);
            const variantText = lineItem.variant_attributes
              ? Object.entries(lineItem.variant_attributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')
              : null;

            return (
              <Card key={lineItem.id} className="mb-3">
                <Card.Body>
                  <div className="d-flex mb-3">
                    <div
                      className="line-item-image me-3"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #dee2e6',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {lineItem.product?.images?.[0] ? (
                        <img
                          src={lineItem.product.images[0]}
                          alt={lineItem.product_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <span className="text-muted">📦</span>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold mb-1">{lineItem.product_name}</div>
                      {lineItem.product_sku && (
                        <div className="text-muted small">SKU: {lineItem.product_sku}</div>
                      )}
                      {variantText && (
                        <div className="text-muted small">{variantText}</div>
                      )}
                      <div className="mt-2">
                        <Badge
                          variant={
                            lineItem.type === LineItemType.PHYSICAL
                              ? 'info'
                              : lineItem.type === LineItemType.DIGITAL
                              ? 'success'
                              : 'warning'
                          }
                          pill
                        >
                          {lineItem.type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Quantity:</span>
                    <span className="fw-semibold">{lineItem.quantity}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Price:</span>
                    <span className="fw-semibold">
                      {lineItem.currency} {itemTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Status:</span>
                    <OrderStatusBadge status={lineItem.status} size="sm" />
                  </div>

                  {/* Digital Download Button */}
                  {lineItem.type === LineItemType.DIGITAL &&
                    lineItem.status === DigitalItemStatus.ACCESS_GRANTED && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        fullWidth
                        className="mt-3"
                        onClick={() => {
                          const data = lineItem.fulfillment_data as DigitalFulfillmentData;
                          if (data?.download_url) {
                            window.open(data.download_url, '_blank');
                            toast.success('Download started!');
                          } else {
                            toast.error('Download URL not available');
                          }
                        }}
                      >
                        Download
                      </Button>
                    )}

                  {/* Service Booking Info */}
                  {lineItem.type === LineItemType.SERVICE &&
                    lineItem.fulfillment_data &&
                    (lineItem.fulfillment_data as ServiceFulfillmentData).booking_date && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <div className="small">
                          <div className="fw-semibold mb-1">Booking Details:</div>
                          <div>{(lineItem.fulfillment_data as ServiceFulfillmentData).booking_date}</div>
                          {(lineItem.fulfillment_data as ServiceFulfillmentData).booking_slot && (
                            <div>{(lineItem.fulfillment_data as ServiceFulfillmentData).booking_slot}</div>
                          )}
                          {(lineItem.fulfillment_data as ServiceFulfillmentData).location && (
                            <div>{(lineItem.fulfillment_data as ServiceFulfillmentData).location}</div>
                          )}
                        </div>
                      </div>
                    )}
                </Card.Body>
              </Card>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}

export default LineItemsSection;
