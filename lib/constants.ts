/**
 * Constants used throughout the application
 */

// Return reason display labels
export const reasonLabels = {
  DOES_NOT_MEET_EXPECTATIONS: "Does not meet expectations",
  DAMAGED_OR_DEFECTIVE: "Damaged or defective",
  WRONG_ITEM_SHIPPED: "Wrong item shipped",
  CHANGED_MIND: "Changed my mind",
  ORDERED_WRONG_PRODUCT: "Ordered wrong product",
  OTHER: "Other reason",
};

// Return status display labels
export const statusLabels = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECEIVED: "Received",
  REFUNDED: "Refunded",
};

// Return status badge colors
export const statusBadgeColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  RECEIVED: "bg-purple-100 text-purple-800",
  REFUNDED: "bg-green-100 text-green-800",
};
