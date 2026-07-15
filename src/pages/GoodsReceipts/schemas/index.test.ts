import { describe, it, expect } from 'vitest';
import { goodsReceiptSchema, equipmentReceiptSchema } from './index';

describe('goodsReceiptSchema', () => {
  it('should accept valid data', async () => {
    const data = {
      deliveryNoteNumber: 'PGH-001',
      expectedDeliveryDate: '2026-01-01',
      notes: 'Ghi chú test',
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.deliveryNoteNumber).toBe('PGH-001');
    expect(result.notes).toBe('Ghi chú test');
  });

  it('should accept null/empty fields', async () => {
    const data = {
      deliveryNoteNumber: null,
      expectedDeliveryDate: null,
      notes: null,
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.deliveryNoteNumber).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should accept empty object', async () => {
    const result = await goodsReceiptSchema.validate({});
    expect(result).toBeDefined();
  });

  it('should reject deliveryNoteNumber exceeding 100 chars', async () => {
    await expect(
      goodsReceiptSchema.validate({ deliveryNoteNumber: 'A'.repeat(101) })
    ).rejects.toThrow();
  });

  it('should reject notes exceeding 2000 chars', async () => {
    await expect(
      goodsReceiptSchema.validate({ notes: 'A'.repeat(2001) })
    ).rejects.toThrow();
  });
});

describe('equipmentReceiptSchema', () => {
  it('should accept valid data', async () => {
    const data = {
      deliveryNoteNumber: 'PTB-001',
      expectedDeliveryDate: '2026-06-01',
      notes: 'Ghi chú thiết bị',
    };

    const result = await equipmentReceiptSchema.validate(data);
    expect(result.deliveryNoteNumber).toBe('PTB-001');
    expect(result.notes).toBe('Ghi chú thiết bị');
  });

  it('should accept empty object', async () => {
    const result = await equipmentReceiptSchema.validate({});
    expect(result).toBeDefined();
  });

  it('should reject notes exceeding 2000 chars', async () => {
    await expect(
      equipmentReceiptSchema.validate({ notes: 'B'.repeat(2001) })
    ).rejects.toThrow();
  });
});
