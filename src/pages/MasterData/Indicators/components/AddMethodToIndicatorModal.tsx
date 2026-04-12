import React, { useState, useEffect } from "react";
import {
  Modal,
  InputNumber,
  Button,
  Select,
  Row,
  Col,
  Tooltip,
  Card,
  message,
} from "antd";
import Icon from "../../../../components/common/Icon";
import {
  SpecimenTypeDto,
  TestMethodDto,
} from "../../../../services/masterDataService";
import { IndicatorName, RichTextEditor } from "../../../../components/common";
import "./AddMethodToIndicatorModal.css";

interface AddMethodToIndicatorModalProps {
  open: boolean;
  loading: boolean;
  indicatorId: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  specimenTypes: SpecimenTypeDto[];
  testMethods: TestMethodDto[];
  existingMethodKeys: { testMethodId: string; specimenTypeId?: string }[];
  onOk: (
    rows: {
      specimenTypeId: string;
      testMethodId: string;
      unit: string;
      formattedUnit: string;
      unitPrice: number;
    }[]
  ) => void;
  onCancel: () => void;
}

interface MethodRow {
  id: string;
  specimenTypeId: string | undefined;
  testMethodId: string | undefined;
  unit: string;
  formattedUnit: string;
  unitPrice: number;
}

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r =
        (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >>
        (c === "x" ? 0 : 3);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

const createEmptyRow = (): MethodRow => ({
  id: generateId(),
  specimenTypeId: undefined,
  testMethodId: undefined,
  unit: "",
  formattedUnit: "",
  unitPrice: 0,
});

const AddMethodToIndicatorModal: React.FC<AddMethodToIndicatorModalProps> = ({
  open,
  loading,
  indicatorName,
  indicatorFormattedName,
  specimenTypes,
  testMethods,
  existingMethodKeys = [],
  onOk,
  onCancel,
}) => {
  const [rows, setRows] = useState<MethodRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setRows([createEmptyRow()]);
      setErrors({});
    }
  }, [open]);

  const specimenTypeOptions = specimenTypes
    .filter((st) => st.isActive)
    .map((st) => ({
      value: st.id,
      label: `${st.code} - ${st.name}`,
    }));

  const buildTestMethodOptions = (
    specimenTypeId: string | undefined,
    currentRowIndex: number
  ) => {
    if (!specimenTypeId) return [];

    // Test methods already linked with this specimenType
    const existingKeys = new Set(
      existingMethodKeys
        .filter((k) => (k.specimenTypeId || null) === (specimenTypeId || null))
        .map((k) => k.testMethodId)
    );

    // Test methods selected in other rows with same specimenType
    const selectedKeys = new Set(
      rows
        .filter(
          (r, idx) =>
            idx !== currentRowIndex &&
            r.testMethodId &&
            r.specimenTypeId === specimenTypeId
        )
        .map((r) => r.testMethodId!)
    );

    return testMethods
      .filter(
        (tm) =>
          tm.isActive &&
          !existingKeys.has(tm.id) &&
          !selectedKeys.has(tm.id)
      )
      .map((tm) => ({
        value: tm.id,
        label: tm.formattedName ? (
          <IndicatorName name={tm.name} formattedName={tm.formattedName} />
        ) : (
          `${tm.code} - ${tm.name}`
        ),
        searchText: `${tm.code} ${tm.name}`,
      }));
  };

  const handleSpecimenTypeChange = (
    index: number,
    value: string | undefined
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      const row = updated[index];
      // Clear testMethod if specimenType changes
      let newTestMethodId = row.testMethodId;
      if (!value) newTestMethodId = undefined;
      updated[index] = { ...row, specimenTypeId: value, testMethodId: newTestMethodId };
      return updated;
    });
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`row-${index}-specimenType`];
      delete updated[`row-${index}`];
      return updated;
    });
  };

  const handleTestMethodChange = (
    index: number,
    value: string | undefined
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], testMethodId: value };
      return updated;
    });
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`row-${index}`];
      return updated;
    });
  };

  const handleUnitChange = (
    index: number,
    html: string,
    plainText: string
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        formattedUnit: html,
        unit: plainText,
      };
      return updated;
    });
  };

  const handlePriceChange = (index: number, value: number | null) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unitPrice: value ?? 0 };
      return updated;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    const validRows: {
      specimenTypeId: string;
      testMethodId: string;
      unit: string;
      formattedUnit: string;
      unitPrice: number;
    }[] = [];
    const addedKeys = new Set<string>();

    rows.forEach((row, index) => {
      if (!row.specimenTypeId) {
        newErrors[`row-${index}-specimenType`] = "Chọn nền mẫu";
      }
      if (!row.testMethodId) {
        newErrors[`row-${index}`] = "Chọn phương pháp";
      }
      if (!row.specimenTypeId || !row.testMethodId) return;

      const key = `${row.testMethodId}|${row.specimenTypeId}`;
      if (addedKeys.has(key)) {
        newErrors[`row-${index}`] = "Trùng với dòng khác";
        return;
      }

      const isExisting = existingMethodKeys.some(
        (k) =>
          k.testMethodId === row.testMethodId &&
          (k.specimenTypeId || null) === (row.specimenTypeId || null)
      );
      if (isExisting) {
        newErrors[`row-${index}`] = "Phương pháp với nền mẫu này đã tồn tại";
        return;
      }

      addedKeys.add(key);
      validRows.push({
        specimenTypeId: row.specimenTypeId,
        testMethodId: row.testMethodId,
        unit: row.unit,
        formattedUnit: row.formattedUnit,
        unitPrice: row.unitPrice,
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      message.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    if (validRows.length === 0) {
      message.warning("Vui lòng chọn ít nhất một phương pháp");
      return;
    }

    onOk(validRows);
  };

  const handleCancel = () => {
    setRows([]);
    setErrors({});
    onCancel();
  };

  return (
    <Modal
      className="add-method-to-indicator-modal"
      title="Thêm phương pháp"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Hủy"
      width={900}
      centered
      destroyOnHidden
      styles={{
        body: { paddingTop: 16, maxHeight: "70vh", overflowY: "auto" },
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: "#8c8c8c", marginRight: 8 }}>Tên chỉ tiêu:</span>
        <IndicatorName
          name={indicatorName}
          formattedName={indicatorFormattedName}
          style={{ fontWeight: 600 }}
        />
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        {rows.map((row, rowIndex) => (
          <div
            key={row.id}
            style={{ marginBottom: rowIndex === rows.length - 1 ? 0 : 16 }}
          >
            <Row gutter={8} align="top" wrap={false}>
              <Col flex="0 0 180px">
                <Select
                  value={row.specimenTypeId}
                  onChange={(v) => handleSpecimenTypeChange(rowIndex, v)}
                  options={specimenTypeOptions}
                  placeholder="Chọn nền mẫu *"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  allowClear
                  status={
                    errors[`row-${rowIndex}-specimenType`] ? "error" : undefined
                  }
                  style={{ width: "100%" }}
                />
                {errors[`row-${rowIndex}-specimenType`] && (
                  <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
                    {errors[`row-${rowIndex}-specimenType`]}
                  </div>
                )}
              </Col>
              <Col flex="1 1 30%">
                <Select
                  value={row.testMethodId}
                  onChange={(v) => handleTestMethodChange(rowIndex, v)}
                  options={buildTestMethodOptions(row.specimenTypeId, rowIndex)}
                  placeholder={
                    row.specimenTypeId
                      ? "Chọn phương pháp"
                      : "Chọn nền mẫu trước"
                  }
                  showSearch
                  filterOption={(input, option) => {
                    const searchText = (option as { searchText?: string })
                      ?.searchText;
                    if (!searchText) return false;
                    return searchText
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }}
                  allowClear
                  disabled={!row.specimenTypeId}
                  status={errors[`row-${rowIndex}`] ? "error" : undefined}
                  style={{ width: "100%" }}
                />
                {errors[`row-${rowIndex}`] && (
                  <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
                    {errors[`row-${rowIndex}`]}
                  </div>
                )}
              </Col>
              <Col flex="1 1 25%">
                <RichTextEditor
                  key={row.id}
                  value={row.formattedUnit}
                  onChange={(html, plainText) =>
                    handleUnitChange(rowIndex, html, plainText)
                  }
                  placeholder="Nhập đơn vị tính"
                />
              </Col>
              <Col flex="0 0 130px">
                <InputNumber<number>
                  value={row.unitPrice}
                  onChange={(v) => handlePriceChange(rowIndex, v)}
                  placeholder="Đơn giá"
                  min={0}
                  precision={0}
                  controls={false}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => {
                    const parsed = parseInt(
                      value?.replace(/[^\d]/g, "") || "0",
                      10
                    );
                    return Math.max(0, parsed);
                  }}
                  addonAfter="đ"
                />
              </Col>
              <Col flex="32px">
                {rows.length > 1 && (
                  <Tooltip title="Xóa dòng">
                    <Icon
                      name="trash3"
                      onClick={() => handleRemoveRow(rowIndex)}
                      style={{
                        fontSize: 16,
                        color: "#CF1322",
                        cursor: "pointer",
                        marginTop: 8,
                      }}
                    />
                  </Tooltip>
                )}
              </Col>
            </Row>
          </div>
        ))}
      </Card>

      <Button
        type="default"
        onClick={handleAddRow}
        icon={<Icon name="plus-lg" />}
        style={{ marginBottom: 12 }}
      >
        Thêm dòng
      </Button>
    </Modal>
  );
};

export default AddMethodToIndicatorModal;
