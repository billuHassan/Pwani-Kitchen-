import { describe, expect, it } from 'vitest';
import {
  addCartLine,
  changeCartLineQuantity,
  restoreCartLines,
  type CartDish,
  type CartLine,
} from '../src/cart';

const burger: CartDish = {
  id: 'classic-beef-burger',
  name: 'Classic Beef Burger',
  price: 12000,
  flavours: ['Classic grill', 'Peri peri'],
  toppings: ['Cheese slice', 'Pickles', 'No extra topping'],
};

describe('cart line identity', () => {
  it('keeps different customizations as independent cart lines', () => {
    const cart = [
      { flavour: 'Classic grill', topping: 'Cheese slice' },
      { flavour: 'Peri peri', topping: 'Pickles' },
    ].reduce<CartLine<CartDish>[]>(
      (current, choice) => addCartLine(current, burger, choice),
      []
    );

    expect(cart).toHaveLength(2);
    expect(cart.map((line) => line.quantity)).toEqual([1, 1]);
    expect(new Set(cart.map((line) => line.id)).size).toBe(2);
  });

  it('merges repeated additions of the exact same dish customization', () => {
    const first = addCartLine([], burger, {
      flavour: 'Classic grill',
      topping: 'Cheese slice',
    });
    const second = addCartLine(first, burger, {
      flavour: 'Classic grill',
      topping: 'Cheese slice',
    });

    expect(second).toHaveLength(1);
    expect(second[0].quantity).toBe(2);
  });

  it('changes quantity by cart line id, not dish id', () => {
    const cart = [
      { flavour: 'Classic grill', topping: 'Cheese slice' },
      { flavour: 'Peri peri', topping: 'Pickles' },
    ].reduce<CartLine<CartDish>[]>(
      (current, choice) => addCartLine(current, burger, choice),
      []
    );
    const updated = changeCartLineQuantity(cart, cart[1].id, 2);

    expect(updated[0].quantity).toBe(1);
    expect(updated[1].quantity).toBe(3);
  });

  it('restores and normalizes persisted cart lines against the current menu', () => {
    const restored = restoreCartLines(
      [
        { dish: { id: burger.id }, quantity: 2, flavour: 'Peri peri', topping: 'Pickles' },
        { dish: { id: burger.id }, quantity: 3, flavour: 'Peri peri', topping: 'Pickles' },
        { dish: { id: 'removed-dish' }, quantity: 4 },
      ],
      [burger]
    );

    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({
      dish: burger,
      quantity: 5,
      flavour: 'Peri peri',
      topping: 'Pickles',
    });
  });
});
