import { describe, it, expect } from 'vitest';
import { goodsReceiptSchema, equipmentReceiptSchema } from './index';

describe('goodsReceiptSchema', () => {
  it('should accept valid data without supplierId', async () => {
    const data = {
      supplierId: null,
      supplierAddress: '123 Đường Test',
      supplierPhone: '0901234567',
      purchaserName: 'Nguyễn Văn A',
      deliveryNoteNumber: 'PGH-001',
      documentDate: '2026-01-01',
      documentExpiryDate: '2026-12-31',
      supplierRepresentativePhone: '0912345678',
      vatPercent: 8,
      notes: 'Ghi chú test',
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.supplierId).toBeNull();
    expect(result.supplierAddress).toBe('123 Đường Test');
    expect(result.supplierPhone).toBe('0901234567');
  });

  it('should accept null supplierAddress and supplierPhone', async () => {
    const data = {
      supplierId: null,
      supplierAddress: null,
      supplierPhone: null,
      vatPercent: 8,
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.supplierAddress).toBeNull();
    expect(result.supplierPhone).toBeNull();
  });

  it('should accept empty string supplierAddress', async () => {
    const data = {
      supplierId: null,
      supplierAddress: '',
      supplierPhone: '',
      vatPercent: 8,
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.supplierAddress).toBe('');
    expect(result.supplierPhone).toBe('');
  });

  it('should reject supplierAddress exceeding 500 chars', async () => {
    const data = {
      supplierId: null,
      supplierAddress: 'A'.repeat(501),
      vatPercent: 8,
    };

    await expect(goodsReceiptSchema.validate(data)).rejects.toThrow();
  });

  it('should reject supplierPhone exceeding 20 chars', async () => {
    const data = {
      supplierId: null,
      supplierPhone: '0'.repeat(21),
      vatPercent: 8,
    };

    await expect(goodsReceiptSchema.validate(data)).rejects.toThrow();
  });

  it('should NOT require supplierId (nullable)', async () => {
    const data = {
      supplierId: null,
      vatPercent: 8,
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.supplierId).toBeNull();
  });

  it('should accept supplierId as string when provided', async () => {
    const data = {
      supplierId: 'some-uuid',
      vatPercent: 8,
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.supplierId).toBe('some-uuid');
  });

  it('should default vatPercent to 8', async () => {
    const data = {
      supplierId: null,
    };

    const result = await goodsReceiptSchema.validate(data);
    expect(result.vatPercent).toBe(8);
  });
});

describe('equipmentReceiptSchema', () => {
  it('should accept supplierAddress and supplierPhone', async () => {
    const data = {
      supplierId: null,
      supplierAddress: 'Địa chỉ thiết bị NCC',
      supplierPhone: '0911222333',
      vatPercent: 10,
    };

    const result = await equipmentReceiptSchema.validate(data);
    expect(result.supplierAddress).toBe('Địa chỉ thiết bị NCC');
    expect(result.supplierPhone).toBe('0911222333');
  });

  it('should accept null supplierAddress and supplierPhone', async () => {
    const data = {
      supplierId: null,
      supplierAddress: null,
      supplierPhone: null,
      vatPercent: 8,
    };

    const result = await equipmentReceiptSchema.validate(data);
    expect(result.supplierAddress).toBeNull();
    expect(result.supplierPhone).toBeNull();
  });

  it('should reject supplierAddress exceeding 500 chars', async () => {
    const data = {
      supplierId: null,
      supplierAddress: 'B'.repeat(501),
      vatPercent: 8,
    };

    await expect(equipmentReceiptSchema.validate(data)).rejects.toThrow();
  });
});
