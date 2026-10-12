import { describe, expect, it } from 'vitest';
import {
  buildOrderItems,
  calculateVoucherDiscount,
  nextStatus,
} from '../backend/orderLogic';

describe('backend order item integrity', () => {
  it('preserves multiple variants of one dish as separate order items', () => {
    const result = buildOrderItems([
      {
        id: 'classic-beef-burger',
        quantity: 1,
        flavour: 'Classic grill',
        topping: 'Cheese slice',
      },
      {
        id: 'classic-beef-burger',
        quantity: 2,
        flavour: 'Peri peri',
        topping: 'Pickles',
      },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value.map((item) => item.lineTotal)).toEqual([12000, 24000]);
    expect(result.value.map((item) => item.flavour)).toEqual(['Classic grill', 'Peri peri']);
  });

  it('merges exact duplicate customizations after validation', () => {
    const result = buildOrderItems([
      {
        id: 'chicken-biryani',
        quantity: 1,
        flavour: 'House spice',
        topping: 'Raita',
      },
      {
        id: 'chicken-biryani',
        quantity: 2,
        flavour: 'House spice',
        topping: 'Raita',
      },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]).toMatchObject({
      id: 'chicken-biryani',
      quantity: 3,
      lineTotal: 51000,
      flavour: 'House spice',
      topping: 'Raita',
    });
  });

  it('rejects invalid menu options and never accepts client prices', () => {
    const result = buildOrderItems([
      {
        id: 'classic-beef-burger',
        quantity: 1,
        flavour: 'Impossible flavour',
        topping: 'Cheese slice',
        price: 1,
      },
    ]);

    expect(result.ok).toBe(false);
  });

  it('calculates vouchers from trusted server subtotal', () => {
    const result = calculateVoucherDiscount('TAWAKKAL10', 36000);

    expect(result).toEqual({ ok: true, value: 3600 });
  });

  it('returns the valid next status for pickup and delivery orders', () => {
    expect(nextStatus('Confirmed', 'pickup')).toBe('Preparing');
    expect(nextStatus('Preparing', 'pickup')).toBe('Ready for Pickup');
    expect(nextStatus('Preparing', 'delivery')).toBe('Out for Delivery');
  });
});
