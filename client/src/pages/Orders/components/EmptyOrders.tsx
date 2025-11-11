import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBag } from 'react-icons/fa';

/**
 * EmptyOrders Component
 *
 * Displays an empty state when the user has no orders
 * with a call-to-action to start shopping
 */
export function EmptyOrders() {
  const navigate = useNavigate();

  return (
    <div className="empty-orders text-center py-5">
      <div className="empty-orders__icon mb-4">
        <FaShoppingBag size={80} className="text-muted" />
      </div>
      <h3 className="empty-orders__title mb-3">No Orders Yet</h3>
      <p className="text-muted mb-4">
        You haven't placed any orders yet. Start shopping to see your orders here!
      </p>
      <Button
        variant="primary"
        size="lg"
        onClick={() => navigate('/catalog')}
      >
        Start Shopping
      </Button>
    </div>
  );
}

export default EmptyOrders;
