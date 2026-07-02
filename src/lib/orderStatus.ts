import type { Order, OrderStatus } from '../types/types';

export const ORDER_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
} as const satisfies Record<OrderStatus, OrderStatus>;

export const ORDER_STATUSES = [
  ORDER_STATUS.pending,
  ORDER_STATUS.confirmed,
  ORDER_STATUS.completed,
  ORDER_STATUS.cancelled,
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_TONES: Record<OrderStatus, string> = {
  pending: 'bg-champagne/12 text-champagne',
  confirmed: 'bg-sage/12 text-sage',
  completed: 'bg-porcelain/12 text-porcelain',
  cancelled: 'bg-blush/12 text-blush',
};

export function countOrdersByStatus(orders: Order[], status: OrderStatus) {
  return orders.filter((order) => order.status === status).length;
}

export function formatOrderDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getShortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function getCustomerLabel(order: Order) {
  return order.customer_name?.trim() || 'Customer WhatsApp';
}
