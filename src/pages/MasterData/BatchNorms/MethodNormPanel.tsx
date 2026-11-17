import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { batchNormService, type MethodBatchNormDto } from "../../../services/serviceCatalogService";
import type { ProductDto } from "../../../services/productService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { loadConsumableProducts } from "./productCache";
import MethodNormTable from "./BatchNorms/MethodNormTable";
import NormFormModal from "./NormFormModal";

export interface MethodNormPanelProps {
  testMethodId: string;
  testMethodName: string;
  /** Báo lên cha khi định mức thay đổi (cập nhật số vật tư / trạng thái khai báo) */
  onChanged?: (norms: MethodBatchNormDto[]) => void;
}

/**
 * Container định mức của 1 phương pháp: tự tải + thêm / sửa / ngừng / xóa.
 * Dùng ở dòng mở rộng màn L3 và popup "cần thiết lập tiêu hao" khi chấp nhận thử nghiệm.
 */
const MethodNormPanel: React.FC<MethodNormPanelProps> = ({ testMethodId, testMethodName, onChanged }) => {
  const [norms, setNorms] = useState<MethodBatchNormDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; norm: MethodBatchNormDto | null }>({
    open: false,
    norm: null,
  });

  const canCreate = authService.hasPermission(PERMISSIONS.MasterData.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  const applyNorms = useCallback(
    (next: MethodBatchNormDto[]) => {
      setNorms(next);
      onChanged?.(next);
    },
    [onChanged]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([batchNormService.getByMethod(testMethodId), loadConsumableProducts()])
      .then(([normList, productList]) => {
        if (cancelled) return;
        setNorms(normList);
        setProducts(productList);
      })
      .catch((error) => {
        if (!cancelled) message.error(getApiErrorMessage(error, "Không tải được định mức"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [testMethodId]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const usedProductIds = useMemo(
    () => norms.filter((n) => n.productId).map((n) => n.productId as string),
    [norms]
  );

  const handleSaved = useCallback(
    (saved: MethodBatchNormDto) => {
      const exists = norms.some((n) => n.id === saved.id);
      applyNorms(exists ? norms.map((n) => (n.id === saved.id ? saved : n)) : [...norms, saved]);
      setEditing({ open: false, norm: null });
    },
    [norms, applyNorms]
  );

  const handleToggleActive = useCallback(
    async (norm: MethodBatchNormDto) => {
      try {
        const saved = await batchNormService.toggleActive(norm.id);
        applyNorms(norms.map((n) => (n.id === saved.id ? saved : n)));
      } catch (error) {
        message.error(getApiErrorMessage(error, "Không đổi được trạng thái"));
      }
    },
    [norms, applyNorms]
  );

  const handleDelete = useCallback(
    async (norm: MethodBatchNormDto) => {
      try {
        await batchNormService.delete(norm.id);
        message.success("Đã xóa định mức");
        applyNorms(norms.filter((n) => n.id !== norm.id));
      } catch (error) {
        message.error(getApiErrorMessage(error, "Không xóa được định mức"));
      }
    },
    [norms, applyNorms]
  );

  return (
    <>
      <MethodNormTable
        norms={norms}
        loading={loading}
        productMap={productMap}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={() => setEditing({ open: true, norm: null })}
        onEdit={(norm) => setEditing({ open: true, norm })}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />
      <NormFormModal
        open={editing.open}
        testMethodId={testMethodId}
        testMethodName={testMethodName}
        norm={editing.norm}
        products={products}
        usedProductIds={usedProductIds}
        onSaved={handleSaved}
        onCancel={() => setEditing({ open: false, norm: null })}
      />
    </>
  );
};

export default MethodNormPanel;
