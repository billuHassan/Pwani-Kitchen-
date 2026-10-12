export type MenuLine = { id: string; quantity: number; flavour?: string; topping?: string };
export type ServiceType = 'delivery' | 'pickup';
export type PaymentMethod = 'mobile-money-demo' | 'card-demo' | 'pay-on-pickup';
export type Status = 'Confirmed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed';
export type Dish = { id: string; name: string; price: number; flavours: string[]; toppings: string[] };
export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  flavour: string;
  topping: string;
};

type Voucher = { min: number; kind: 'percent' | 'fixed'; value: number };
type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string; status: number };

const DEFAULT_TOPPING = 'No extra topping';
const MAX_LINE_QUANTITY = 30;
const MAX_ORDER_LINES = 50;

export const MENU: Dish[] = [
  { id: 'classic-beef-burger', name: 'Classic Beef Burger', price: 12000, flavours: ['Classic grill', 'Peri peri', 'Smoky BBQ'], toppings: ['Cheese slice', 'Caramelized onions', 'Pickles', 'No extra topping'] },
  { id: 'double-cheese-burger', name: 'Double Cheese Burger', price: 16000, flavours: ['Classic grill', 'Smoky BBQ', 'Chilli beef'], toppings: ['Extra cheese', 'Pickles', 'Crispy onions', 'No extra topping'] },
  { id: 'zinger-chicken-burger', name: 'Zinger Chicken Burger', price: 13500, flavours: ['Original crispy', 'Hot zinger', 'Garlic mayo'], toppings: ['Cheese slice', 'Lettuce crunch', 'Jalapenos', 'No extra topping'] },
  { id: 'margherita-pizza', name: 'Margherita Pizza', price: 18000, flavours: ['Classic tomato', 'Extra basil', 'Garlic crust'], toppings: ['Extra mozzarella', 'Olives', 'Sweet corn', 'No extra topping'] },
  { id: 'chicken-supreme-pizza', name: 'Chicken Supreme Pizza', price: 23000, flavours: ['BBQ chicken', 'Peri peri chicken', 'Creamy ranch'], toppings: ['Extra chicken', 'Mushrooms', 'Green peppers', 'No extra topping'] },
  { id: 'loaded-fries', name: 'Loaded Fries', price: 9000, flavours: ['Salted', 'Masala', 'Peri peri'], toppings: ['Cheese sauce', 'Garlic mayo', 'Chicken bits', 'No extra topping'] },
  { id: 'grilled-sausage-plate', name: 'Grilled Sausage Plate', price: 8500, flavours: ['Original', 'Chilli garlic', 'BBQ glaze'], toppings: ['Kachumbari', 'Mustard drizzle', 'Chips side', 'No extra topping'] },
  { id: 'crispy-chicken-pieces', name: 'Crispy Chicken Pieces', price: 15000, flavours: ['Original crispy', 'Hot and spicy', 'Lemon herb'], toppings: ['Garlic dip', 'Chilli sauce', 'Coleslaw', 'No extra topping'] },
  { id: 'chicken-biryani', name: 'Chicken Biryani', price: 17000, flavours: ['Mild spice', 'House spice', 'Extra hot'], toppings: ['Boiled egg', 'Kachumbari', 'Raita', 'No extra topping'] },
  { id: 'beef-biryani', name: 'Beef Biryani', price: 18500, flavours: ['Mild spice', 'House spice', 'Extra hot'], toppings: ['Boiled egg', 'Kachumbari', 'Raita', 'No extra topping'] },
  { id: 'chicken-pilau', name: 'Chicken Pilau', price: 15500, flavours: ['Classic pilau', 'Extra aromatic', 'Chilli pilau'], toppings: ['Kachumbari', 'Crispy onions', 'Lime wedge', 'No extra topping'] },
  { id: 'mango-passion-juice', name: 'Mango Passion Juice', price: 5000, flavours: ['Mango passion', 'Extra lime', 'Less sweet'], toppings: ['Fresh mint', 'Ice cubes', 'Chia sprinkle', 'No extra topping'] },
];

export const VOUCHERS: Record<string, Voucher> = {
  TAWAKKAL10: { min: 20000, kind: 'percent', value: 10 },
  FAMILY15: { min: 45000, kind: 'percent', value: 15 },
  FAST5000: { min: 50000, kind: 'fixed', value: 5000 },
};

export function nextStatus(status: Status, serviceType: ServiceType): Status {
  if (status === 'Confirmed') return 'Preparing';
  if (status === 'Preparing') return serviceType === 'pickup' ? 'Ready for Pickup' : 'Out for Delivery';
  return 'Completed';
}

export function buildOrderItems(lines: unknown): ValidationResult<OrderItem[]> {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > MAX_ORDER_LINES) {
    return { ok: false, message: 'Add between 1 and 50 valid menu lines before placing an order.', status: 400 };
  }

  const merged = new Map<string, OrderItem>();

  for (const rawLine of lines) {
    if (!rawLine || typeof rawLine !== 'object') {
      return { ok: false, message: 'Each submitted item must be a valid menu line.', status: 400 };
    }

    const item = rawLine as MenuLine;
    if (typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_LINE_QUANTITY) {
      return { ok: false, message: 'Each quantity must be between 1 and 30.', status: 400 };
    }

    const dish = MENU.find((candidate) => candidate.id === item.id);
    if (!dish) {
      return { ok: false, message: 'An item is not part of this sample menu.', status: 400 };
    }

    const flavour = item.flavour || dish.flavours[0];
    const topping = item.topping || DEFAULT_TOPPING;

    if (!dish.flavours.includes(flavour)) {
      return { ok: false, message: 'Choose a valid flavour for each sample dish.', status: 400 };
    }
    if (!dish.toppings.includes(topping)) {
      return { ok: false, message: 'Choose a valid topping for each sample dish.', status: 400 };
    }

    const key = [dish.id, flavour, topping].join('::');
    const existing = merged.get(key);
    const quantity = (existing?.quantity || 0) + item.quantity;
    if (quantity > MAX_LINE_QUANTITY) {
      return { ok: false, message: 'Each customized dish has a maximum demo quantity of 30.', status: 400 };
    }

    merged.set(key, {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      quantity,
      lineTotal: dish.price * quantity,
      flavour,
      topping,
    });
  }

  return { ok: true, value: [...merged.values()] };
}

export function calculateVoucherDiscount(code: string, subtotal: number): ValidationResult<number> {
  if (!code) return { ok: true, value: 0 };

  const voucher = VOUCHERS[code];
  if (!voucher || subtotal < voucher.min) {
    return { ok: false, message: 'The voucher is invalid for this order total.', status: 400 };
  }

  const discount =
    voucher.kind === 'percent'
      ? Math.round((subtotal * voucher.value) / 100)
      : Math.min(voucher.value, subtotal);

  return { ok: true, value: discount };
}
