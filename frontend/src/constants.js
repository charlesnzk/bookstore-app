export const STATUS_COLORS = {
  pending: "yellow",
  confirmed: "blue",
  shipped: "indigo",
  delivered: "green",
  cancelled: "red",
};

export const STATUS_ICONS = {
  pending: "⏳",
  confirmed: "✅",
  shipped: "🚚",
  delivered: "📦",
  cancelled: "❌",
};

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const DELIVERY_OPTIONS = [
  { value: "standard", label: "Standard (3-5 days)" },
  { value: "express", label: "Express (1-2 days)" },
  { value: "pickup", label: "Self Pickup (same day)" },
];
