export const DEFAULT_TOPPING = 'No extra topping';
export const MAX_CART_LINE_QUANTITY = 30;

export type DishChoice = {
  flavour: string;
  topping: string;
};

export type CartDish = {
  id: string;
  name: string;
  price: number;
  flavours: string[];
  toppings: string[];
};

export type CartLine<DishType extends CartDish = CartDish> = {
  id: string;
  dish: DishType;
  quantity: number;
  flavour: string;
  topping: string;
};

const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(MAX_CART_LINE_QUANTITY, Math.trunc(quantity)));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

export function normalizeDishChoice<DishType extends CartDish>(
  dish: DishType,
  choice?: Partial<DishChoice> | null
): DishChoice {
  const flavour =
    choice?.flavour && dish.flavours.includes(choice.flavour)
      ? choice.flavour
      : dish.flavours[0];
  const topping =
    choice?.topping && dish.toppings.includes(choice.topping)
      ? choice.topping
      : DEFAULT_TOPPING;

  return { flavour, topping };
}

export function cartLineId(dishId: string, choice: DishChoice): string {
  return [dishId, choice.flavour, choice.topping]
    .map((part) => encodeURIComponent(part))
    .join('__');
}

export function addCartLine<DishType extends CartDish>(
  current: CartLine<DishType>[],
  dish: DishType,
  choiceInput?: Partial<DishChoice> | null
): CartLine<DishType>[] {
  const choice = normalizeDishChoice(dish, choiceInput);
  const id = cartLineId(dish.id, choice);
  const existing = current.find((line) => line.id === id);

  if (existing) {
    return current.map((line) =>
      line.id === id
        ? { ...line, quantity: Math.min(MAX_CART_LINE_QUANTITY, line.quantity + 1) }
        : line
    );
  }

  return [...current, { id, dish, quantity: 1, ...choice }];
}

export function changeCartLineQuantity<DishType extends CartDish>(
  current: CartLine<DishType>[],
  lineId: string,
  amount: number
): CartLine<DishType>[] {
  return current
    .map((line) =>
      line.id === lineId
        ? { ...line, quantity: Math.min(MAX_CART_LINE_QUANTITY, line.quantity + amount) }
        : line
    )
    .filter((line) => line.quantity > 0);
}

export function restoreCartLines<DishType extends CartDish>(
  rawValue: unknown,
  menu: DishType[]
): CartLine<DishType>[] {
  if (!Array.isArray(rawValue)) return [];

  const restored = new Map<string, CartLine<DishType>>();

  for (const rawLine of rawValue) {
    if (!isRecord(rawLine)) continue;

    const rawDish = rawLine.dish;
    const dishId =
      isRecord(rawDish) && typeof rawDish.id === 'string'
        ? rawDish.id
        : typeof rawLine.id === 'string'
          ? rawLine.id
          : '';
    const dish = menu.find((candidate) => candidate.id === dishId);
    if (!dish) continue;

    const choice = normalizeDishChoice(dish, {
      flavour: typeof rawLine.flavour === 'string' ? rawLine.flavour : undefined,
      topping: typeof rawLine.topping === 'string' ? rawLine.topping : undefined,
    });
    const id = cartLineId(dish.id, choice);
    const parsedQuantity =
      typeof rawLine.quantity === 'number'
        ? rawLine.quantity
        : Number(rawLine.quantity);
    const quantity = Number.isFinite(parsedQuantity) ? clampQuantity(parsedQuantity) : 1;
    const existing = restored.get(id);

    if (existing) {
      restored.set(id, {
        ...existing,
        quantity: Math.min(MAX_CART_LINE_QUANTITY, existing.quantity + quantity),
      });
    } else {
      restored.set(id, { id, dish, quantity, ...choice });
    }
  }

  return [...restored.values()];
}
