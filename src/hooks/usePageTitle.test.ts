import { describe, it, expect } from 'vitest';
import { getTitleForPath } from './usePageTitle';

describe('getTitleForPath - GoodsReceipts routes', () => {
  it('should return title for goods receipts list', () => {
    expect(getTitleForPath('/goods-receipts')).toBe('Phiếu nhập hàng');
  });

  it('should return title for create goods receipt (vật tư)', () => {
    expect(getTitleForPath('/goods-receipts/create')).toBe('Tạo yêu cầu mua sắm');
  });

  it('should return title for create equipment receipt', () => {
    expect(getTitleForPath('/goods-receipts/create-equipment')).toBe('Tạo phiếu nhập thiết bị');
  });

  it('should return title for edit goods receipt (vật tư)', () => {
    expect(getTitleForPath('/goods-receipts/edit/some-uuid')).toBe('Sửa phiếu nhập vật tư');
  });

  it('should return title for edit equipment receipt', () => {
    expect(getTitleForPath('/goods-receipts/edit-equipment/some-uuid')).toBe('Sửa phiếu nhập thiết bị');
  });

  it('should return title for goods receipt detail', () => {
    expect(getTitleForPath('/goods-receipts/some-uuid')).toBe('Chi tiết phiếu nhập hàng');
  });

  it('should match list route for sub-paths (end: false)', () => {
    expect(getTitleForPath('/goods-receipts/anything-else')).not.toBe('');
  });
});

describe('getTitleForPath - Other routes still work', () => {
  it('should return title for dashboard', () => {
    expect(getTitleForPath('/dashboard')).toBe('Tổng quan');
  });

  it('should return title for receipts (phiếu thu)', () => {
    expect(getTitleForPath('/receipts')).toBe('Phiếu thu');
  });

  it('should return empty for unknown route', () => {
    expect(getTitleForPath('/completely-unknown-route')).toBe('');
  });
});
