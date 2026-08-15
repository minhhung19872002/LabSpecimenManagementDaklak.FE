import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Modal } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  materialReceiptService,
  MaterialReceiptStatus,
  type CentralWarehouseProductDto,
  type CreateUpdateMaterialReceiptDto,
  type ReceivingWarehouseStockDto,
} from "../../services/materialReceiptService";
import { productService, type CreateUpdateProductDto } from "../../services/productService";
import {
  warehouseService,
  type WarehouseDto,
} from "../../services/masterDataService";
import { authService } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PATH_ROUTES } from "../../constants/routes";
import MaterialReceiptFormView from "./MaterialReceipt/MaterialReceiptFormView";
import {
  type MaterialReceiptLineItem,
  buildLineItemFromProduct,
} from "./MaterialReceipt/utils";

const ProductModal = lazy(
  () => import("../Products/components/ProductModal"),
);

const MaterialReceiptForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isReadonly, setIsReadonly] = useState(false);

  const [code, setCode] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiptDate, setReceiptDate] = useState<Dayjs | null>(dayjs());
  const [codeError, setCodeError] = useState<string>();

  const [centralProducts, setCentralProducts] = useState<
    CentralWarehouseProductDto[]
  >([]);
  const [items, setItems] = useState<MaterialReceiptLineItem[]>([]);
  const [itemErrors, setItemErrors] = useState<
    Record<string, { quantity?: string; receivingWarehouseId?: string }>
  >({});
  const stockCacheRef = useRef<Map<string, ReceivingWarehouseStockDto>>(new Map());
  const [productTypeFilter, setProductTypeFilter] = useState("all");

  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);

  const filteredProductOptions = useMemo(() => {
    const addedIds = new Set(items.map((i) => i.productId));
    return centralProducts
      .filter(
        (p) =>
          !addedIds.has(p.productId) &&
          (productTypeFilter === "all" ||
            p.productType === Number(productTypeFilter)),
      )
      .map((p) => ({
        value: p.productId,
        label: p.identificationCode
          ? `${p.identificationCode} - ${p.productName}`
          : p.productName,
      }));
  }, [centralProducts, items, productTypeFilter]);

  useEffect(() => {
    const user = authService.getUserInfo();
    if (user) {
      setReceiverName(user.fullName || user.userName);
    }
  }, []);

  useEffect(() => {
    warehouseService.getActiveForUser().then((list) => {
      const nonDefault = list.filter((w) => !w.isDefault);
      setWarehouses(nonDefault);
    });
  }, []);

  useEffect(() => {
    if (!isEdit) {
      materialReceiptService.getNextCode().then((nextCode) => {
        setCode(nextCode);
      });
    }
  }, [isEdit]);

  useEffect(() => {
    materialReceiptService.getCentralWarehouseProducts().then((products) => {
      setCentralProducts(products);
    });
  }, []);

  useEffect(() => {
    if (centralProducts.length === 0) return;
    setItems((currentItems) =>
      currentItems.map((item) => {
        const product = centralProducts.find((p) => p.productId === item.productId);
        if (!product) return item;
        return {
          ...item,
          availableUnits: product.availableUnits,
          centralStockBaseQty: product.centralStockBaseQty,
          storageUnitName: product.storageUnitName,
          consumableUnitName: product.consumableUnitName,
          volumePerUnit: product.volumePerUnit,
          skus: product.skus,
        };
      }),
    );
  }, [centralProducts]);

  const applyWarehouseStock = useCallback(
    (key: string, warehouseId: string, detail: ReceivingWarehouseStockDto) => {
      setItems((prev) =>
        prev.map((item) =>
          item.key === key && item.receivingWarehouseId === warehouseId
            ? {
                ...item,
                currentStockBaseQty: detail.availableBaseQuantity,
                currentStockStorageUnitName: detail.storageUnitName,
                currentStockConsumableUnitName: detail.consumableUnitName,
                currentStockVolumePerUnit: detail.volumePerUnit,
                currentStockLoading: false,
              }
            : item,
        ),
      );
    },
    [],
  );

  const loadWarehouseStock = useCallback(
    async (key: string, productId: string, warehouseId: string) => {
      const cacheKey = `${productId}:${warehouseId}`;
      const cached = stockCacheRef.current.get(cacheKey);
      if (cached) {
        applyWarehouseStock(key, warehouseId, cached);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.key === key
            ? {
                ...item,
                currentStockBaseQty: undefined,
                currentStockLoading: true,
              }
            : item,
        ),
      );

      try {
        const detail = await materialReceiptService.getReceivingWarehouseStock(
          productId,
          warehouseId,
        );
        stockCacheRef.current.set(cacheKey, detail);
        applyWarehouseStock(key, warehouseId, detail);
      } catch (error) {
        setItems((prev) =>
          prev.map((item) =>
            item.key === key ? { ...item, currentStockLoading: false } : item,
          ),
        );
        message.error(
          getApiErrorMessage(error, "Không thể tải tồn kho tại kho nhận"),
        );
      }
    },
    [applyWarehouseStock],
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    materialReceiptService
      .get(id)
      .then((receipt) => {
        setCode(receipt.code);
        setReceiverName(receipt.receiverName);
        setReceiptDate(dayjs(receipt.receiptDate));
        setIsReadonly(receipt.status === MaterialReceiptStatus.Confirmed);
        const mappedItems = receipt.items.map((item) => ({
            id: item.id,
            key: item.id,
            productId: item.productId,
            productName: item.productName,
            identificationCode: item.identificationCode,
            technicalSpec: item.technicalSpec,
            casNumber: item.casNumber,
            nearestExpiryDate: item.nearestExpiryDate,
            productType: item.productType,
            unitId: item.unitId,
            unitName: item.unitName,
            quantity: item.quantity,
            skuId: item.skuId,
            receivingWarehouseId: item.receivingWarehouseId,
            receivingWarehouseName: item.receivingWarehouseName,
            availableUnits: item.availableUnits || [],
            centralStockBaseQty: 0,
            storageUnitName: undefined,
            consumableUnitName: undefined,
            volumePerUnit: undefined,
            skus: [],
          }));
        setItems(mappedItems);
        mappedItems.forEach((item) => {
          if (item.receivingWarehouseId) {
            void loadWarehouseStock(
              item.key,
              item.productId,
              item.receivingWarehouseId,
            );
          }
        });
      })
      .catch((error) => {
        message.error(
          getApiErrorMessage(error, "Không thể tải phiếu nhận vật tư"),
        );
      })
      .finally(() => setLoading(false));
  }, [id, loadWarehouseStock]);

  const handleAddProduct = useCallback(
    (productId: string) => {
      const product = centralProducts.find((p) => p.productId === productId);
      if (!product) return;
      const lineItem = buildLineItemFromProduct(product);
      lineItem.key = `new-${Date.now()}`;
      lineItem.quantity = null;
      setItems((prev) => [...prev, lineItem]);
    },
    [centralProducts],
  );

  const handleItemChange = useCallback(
    (key: string, field: string, value: any) => {
      setItems((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, [field]: value } : item,
        ),
      );
      if (field === "quantity") {
        setItemErrors((prev) => {
          const row = prev[key];
          if (!row?.quantity) return prev;
          const { quantity: _quantity, ...rest } = row;
          return { ...prev, [key]: rest };
        });
      }
    },
    [],
  );

  const handleWarehouseChange = useCallback(
    (key: string, warehouseId: string, warehouseName: string) => {
      const productId = items.find((item) => item.key === key)?.productId;
      setItems((prev) =>
        prev.map((item) => {
          if (item.key !== key) return item;
          return {
            ...item,
            receivingWarehouseId: warehouseId,
            receivingWarehouseName: warehouseName,
            currentStockBaseQty: undefined,
          };
        }),
      );
      setItemErrors((prev) => {
        const row = prev[key];
        if (!row?.receivingWarehouseId) return prev;
        const { receivingWarehouseId: _warehouse, ...rest } = row;
        return { ...prev, [key]: rest };
      });
      if (productId) void loadWarehouseStock(key, productId, warehouseId);
    },
    [items, loadWarehouseStock],
  );

  const handleDeleteItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
    setItemErrors((prev) => {
      const { [key]: _deleted, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleCreateProduct = useCallback(async (data: CreateUpdateProductDto) => {
    setProductModalLoading(true);
    try {
      await productService.create(data);
      message.success("Đã tạo vật tư mới");
      setProductModalOpen(false);
      const products = await materialReceiptService.getCentralWarehouseProducts();
      setCentralProducts(products);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể tạo vật tư."));
    } finally {
      setProductModalLoading(false);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    let valid = true;
    if (!code.trim()) {
      setCodeError("Vui lòng nhập mã phiếu");
      valid = false;
    }
    if (!receiptDate) {
      message.warning("Vui lòng chọn ngày nhận");
      valid = false;
    }
    if (items.length === 0) {
      message.warning("Vui lòng chọn ít nhất một vật tư");
      valid = false;
    }

    const errors: typeof itemErrors = {};
    let hasMissingItemInfo = false;
    let hasInvalidItemInfo = false;
    items.forEach((item) => {
      const rowError: (typeof itemErrors)[string] = {};
      if (item.quantity == null) {
        rowError.quantity = "Vui lòng nhập số lượng nguyên lớn hơn 0";
        hasMissingItemInfo = true;
      } else if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        rowError.quantity = "Vui lòng nhập số lượng nguyên lớn hơn 0";
        hasInvalidItemInfo = true;
      }
      if (!item.receivingWarehouseId) {
        rowError.receivingWarehouseId = "Vui lòng chọn kho nhận";
        hasMissingItemInfo = true;
      }
      if (Object.keys(rowError).length > 0) {
        errors[item.key] = rowError;
        valid = false;
      }
    });
    setItemErrors(errors);
    if (!valid && Object.keys(errors).length > 0) {
      if (hasMissingItemInfo) {
        message.warning("Vui lòng điền đầy đủ thông tin bắt buộc");
      } else if (hasInvalidItemInfo) {
        message.warning("Vui lòng kiểm tra lại thông tin không hợp lệ");
      }
    }
    return valid;
  }, [code, receiptDate, items, itemErrors]);

  const buildPayload = (): CreateUpdateMaterialReceiptDto => ({
    code: code.trim(),
    receiptDate:
      receiptDate?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      unitId: item.unitId,
      quantity: item.quantity || 0,
      skuId: item.skuId,
      receivingWarehouseId: item.receivingWarehouseId || "",
    })),
  });

  const handleSaveDraft = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        const updated = await materialReceiptService.update(id!, payload);
        message.success("Đã lưu nháp phiếu nhận vật tư");
        navigate(PATH_ROUTES.materialReceipts.detail(updated.id), {
          replace: true,
        });
      } else {
        const created = await materialReceiptService.create(payload);
        message.success("Đã tạo nháp phiếu nhận vật tư");
        navigate(PATH_ROUTES.materialReceipts.detail(created.id), {
          replace: true,
        });
      }
    } catch (error) {
      message.error(
        getApiErrorMessage(error, "Không thể lưu phiếu nhận vật tư"),
      );
    } finally {
      setSaving(false);
    }
  }, [code, receiptDate, items, isEdit, id, navigate, validateForm]);

  const handleConfirm = useCallback(async () => {
    if (!validateForm()) return;
    Modal.confirm({
      title: "Xác nhận tạo phiếu nhận vật tư",
      content:
        "Sau khi tạo phiếu, vật tư sẽ được chuyển từ kho trung tâm sang kho nhận. Thao tác này không thể hoàn tác.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        setConfirming(true);
        try {
          const payload = buildPayload();
          let receiptId = id;
          if (isEdit) {
            await materialReceiptService.update(id!, payload);
            const confirmed = await materialReceiptService.confirm(id!);
            receiptId = confirmed.id;
          } else {
            const confirmed = await materialReceiptService.createAndConfirm(payload);
            receiptId = confirmed.id;
          }
          message.success("Đã tạo phiếu nhận vật tư thành công");
          navigate(PATH_ROUTES.materialReceipts.detail(receiptId!), {
            replace: true,
          });
        } catch (error) {
          message.error(
            getApiErrorMessage(error, "Không thể tạo phiếu nhận vật tư"),
          );
        } finally {
          setConfirming(false);
        }
      },
    });
  }, [code, receiptDate, items, isEdit, id, navigate, validateForm]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (loading) return null;

  return (
    <MaterialReceiptFormView
      title={
        isReadonly
          ? `Phiếu nhận vật tư — ${code}`
          : isEdit
            ? "Chỉnh sửa phiếu nhận vật tư"
            : "Tạo phiếu nhận vật tư"
      }
      saving={saving}
      confirming={confirming}
      isReadonly={isReadonly}
      code={code}
      receiverName={receiverName}
      receiptDate={receiptDate}
      codeError={codeError}
      onCodeChange={(val) => {
        setCode(val);
        if (codeError) setCodeError(undefined);
      }}
      onReceiptDateChange={setReceiptDate}
      items={items}
      warehouses={warehouses}
      onItemChange={handleItemChange}
      onWarehouseChange={handleWarehouseChange}
      onDeleteItem={handleDeleteItem}
      itemErrors={itemErrors}
      productTypeFilter={productTypeFilter}
      productOptions={filteredProductOptions}
      itemCount={items.length}
      onProductTypeChange={setProductTypeFilter}
      onAddProduct={handleAddProduct}
      onOpenProductModal={() => setProductModalOpen(true)}
      onSaveDraft={handleSaveDraft}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      <Suspense fallback={null}>
        <ProductModal
          open={productModalOpen}
          loading={productModalLoading}
          editingProduct={null}
          onOk={handleCreateProduct}
          onCancel={() => setProductModalOpen(false)}
        />
      </Suspense>
    </MaterialReceiptFormView>
  );
};

export default MaterialReceiptForm;
