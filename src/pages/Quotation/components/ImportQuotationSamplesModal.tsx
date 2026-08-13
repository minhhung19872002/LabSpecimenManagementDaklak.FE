import React, { useState, useRef } from "react";
import {
  Modal,
  Upload,
  Table,
  Button,
  Space,
  Tag,
  Alert,
  message,
  Spin,
} from "antd";
import {
  UploadOutlined,
  FileExcelOutlined,
  DownloadOutlined,
} from "../../../components/common/Icon";
import * as XLSX from "xlsx";
import {
  testMethodService,
  indicatorService,
  TestMethodWithIndicatorsDto,
  TestMethodIndicatorDto,
  IndicatorDto,
} from "../../../services/masterDataService";
import { API_BASE_URL } from "../../../services/api";
import type {
  QuotationSampleFormData,
  QuotationSampleIndicatorFormData,
} from "../../../types/quotation";
import { formatCurrency } from "../../../utils/formatters";
import type { ColumnsType } from "antd/es/table";



interface ImportQuotationSamplesModalProps {
  visible: boolean;
  onCancel: () => void;
  onImport: (samples: QuotationSampleFormData[]) => void;
  existingSampleCount: number;
}

interface MethodInfo {
  testMethodId: string;
  testMethodName: string;
  testMethodFormattedName?: string;
  unitPrice: number;
  specimenTypeId?: string;
  specimenTypeName?: string;
}

type IndicatorMethodsMap = Record<string, MethodInfo[]>;

interface ParsedRow {
  key: string;
  rowIndex: number;
  sampleName: string;
  quantity: number;
  specimenTypeName: string;
  indicatorName: string;
  matched: boolean;
  matchedIndicatorId?: string;
  matchedIndicatorName?: string;
  matchedIndicatorFormattedName?: string;
  matchedTestMethodId?: string;
  matchedTestMethodName?: string;
  matchedTestMethodFormattedName?: string;
  matchedUnitPrice?: number;
  matchedSpecimenTypeId?: string;
  matchedSpecimenTypeName?: string;
  errorMessage?: string;
}

const TEMPLATE_URL = `${API_BASE_URL}/api/v1/form-templates/download/Meta Data Template/Import bao gia.xlsx`;

const ImportQuotationSamplesModal: React.FC<ImportQuotationSamplesModalProps> = ({
  visible,
  onCancel,
  onImport,
  existingSampleCount,
}) => {
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const masterDataRef = useRef<{
    indicators: IndicatorDto[];
    methodsMap: IndicatorMethodsMap;
    indicatorNameMap: Map<string, IndicatorDto>;
  } | null>(null);

  const loadMasterData = async () => {
    if (masterDataRef.current) return masterDataRef.current;

    const [allIndicators, testMethodsWithIndicators] =
      await Promise.all([
        indicatorService.getActive(true),
        testMethodService.getWithIndicators(),
      ]);

    const methodsMap: IndicatorMethodsMap = {};
    testMethodsWithIndicators.forEach(
      (method: TestMethodWithIndicatorsDto) => {
        method.indicators?.forEach((ind: TestMethodIndicatorDto) => {
          if (!methodsMap[ind.indicatorId]) {
            methodsMap[ind.indicatorId] = [];
          }
          const specimenTypeId = (ind as any).specimenTypeId;
          const specimenTypeName = (ind as any).specimenTypeName;
          const existingKey = `${method.id}_${specimenTypeId || "null"}`;
          if (
            !methodsMap[ind.indicatorId].find(
              (m) =>
                `${m.testMethodId}_${m.specimenTypeId || "null"}` ===
                existingKey
            )
          ) {
            methodsMap[ind.indicatorId].push({
              testMethodId: method.id,
              testMethodName: method.name,
              testMethodFormattedName: method.formattedName || undefined,
              unitPrice: ind.unitPrice,
              specimenTypeId: specimenTypeId || undefined,
              specimenTypeName: specimenTypeName || undefined,
            });
          }
        });
      }
    );

    const indicatorNameMap = new Map<string, IndicatorDto>();
    allIndicators.forEach((ind: IndicatorDto) => {
      indicatorNameMap.set(ind.name.trim().toLowerCase(), ind);
    });

    masterDataRef.current = {
      indicators: allIndicators,
      methodsMap,
      indicatorNameMap,
    };
    return masterDataRef.current;
  };

  const matchRow = (
    row: { sampleName: string; quantity: number; specimenTypeName: string; indicatorName: string },
    rowIndex: number,
    masterData: NonNullable<typeof masterDataRef.current>
  ): ParsedRow => {
    const base: ParsedRow = {
      key: `row-${rowIndex}`,
      rowIndex: rowIndex + 1,
      sampleName: row.sampleName,
      quantity: row.quantity,
      specimenTypeName: row.specimenTypeName,
      indicatorName: row.indicatorName,
      matched: false,
    };

    if (!row.indicatorName?.trim()) {
      return { ...base, errorMessage: "Thiếu chỉ tiêu" };
    }

    const normalizedName = row.indicatorName.trim().toLowerCase();
    const indicator = masterData.indicatorNameMap.get(normalizedName);

    if (!indicator) {
      return { ...base, errorMessage: "Không tìm thấy chỉ tiêu" };
    }

    const methods = masterData.methodsMap[indicator.id];
    if (!methods || methods.length === 0) {
      return { ...base, errorMessage: "Chưa có PP" };
    }

    let matchedMethod: MethodInfo | undefined;

    if (row.specimenTypeName?.trim()) {
      const normalizedST = row.specimenTypeName.trim().toLowerCase();
      matchedMethod = methods.find(
        (m) => m.specimenTypeName?.trim().toLowerCase() === normalizedST
      );
      if (!matchedMethod) {
        matchedMethod = methods[0];
      }
    } else {
      matchedMethod = methods[0];
    }

    return {
      ...base,
      matched: true,
      matchedIndicatorId: indicator.id,
      matchedIndicatorName: indicator.name,
      matchedIndicatorFormattedName: indicator.formattedName || undefined,
      matchedTestMethodId: matchedMethod.testMethodId,
      matchedTestMethodName: matchedMethod.testMethodName,
      matchedTestMethodFormattedName: matchedMethod.testMethodFormattedName,
      matchedUnitPrice: matchedMethod.unitPrice,
      matchedSpecimenTypeId: matchedMethod.specimenTypeId,
      matchedSpecimenTypeName: matchedMethod.specimenTypeName,
    };
  };

  const handleFileUpload = async (file: File) => {
    const validExts = [".xlsx", ".xls"];
    if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      message.error("Chỉ chấp nhận file Excel (.xlsx, .xls)");
      return;
    }

    setLoading(true);
    try {
      const masterData = await loadMasterData();

      const data = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const arrayData = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(arrayData, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
            resolve(jsonData);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Lỗi đọc file"));
        reader.readAsArrayBuffer(file);
      });

      if (data.length === 0) {
        message.error("File Excel không có dữ liệu");
        setLoading(false);
        return;
      }

      const rows = data.map((row: any, idx: number) => {
        const sampleName = (row["Tên mẫu"] || "").toString().trim();
        const quantityRaw = row["Số lượng"];
        const quantity = quantityRaw ? parseInt(quantityRaw, 10) || 1 : 1;
        const specimenTypeName = (row["Nền mẫu"] || row["Nền mẫu "] || "").toString().trim();
        const indicatorName = (row["Chỉ tiêu"] || "").toString().trim();

        return matchRow(
          { sampleName, quantity, specimenTypeName, indicatorName },
          idx,
          masterData
        );
      });

      setParsedRows(rows);
      setStep("preview");
    } catch (error) {
      console.error("Error parsing Excel:", error);
      message.error("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const matchedRows = parsedRows.filter((r) => r.matched);
    if (matchedRows.length === 0) {
      message.warning("Không có chỉ tiêu nào hợp lệ để import");
      return;
    }

    const sampleGroups = new Map<
      string,
      { quantity: number; indicators: ParsedRow[] }
    >();

    matchedRows.forEach((row) => {
      const sampleName = row.sampleName || "Mẫu";
      const groupKey = `${sampleName}__${row.quantity || 1}`;
      if (!sampleGroups.has(groupKey)) {
        sampleGroups.set(groupKey, {
          quantity: row.quantity || 1,
          indicators: [],
        });
      }
      sampleGroups.get(groupKey)!.indicators.push(row);
    });

    let sortOrder = existingSampleCount;
    const newSamples: QuotationSampleFormData[] = [];

    sampleGroups.forEach((group) => {
      sortOrder++;
      const sampleKey = `import-sample-${Date.now()}-${sortOrder}`;
      const sampleName = group.indicators[0]?.sampleName || "Mẫu";
      const indicators: QuotationSampleIndicatorFormData[] = group.indicators.map(
        (row, idx) => ({
          key: `${row.matchedIndicatorId}_${row.matchedTestMethodId}_${row.matchedSpecimenTypeId || "null"}`,
          indicatorId: row.matchedIndicatorId!,
          testMethodId: row.matchedTestMethodId!,
          indicatorName: row.matchedIndicatorName!,
          indicatorFormattedName: row.matchedIndicatorFormattedName,
          testMethodName: row.matchedTestMethodName!,
          testMethodFormattedName: row.matchedTestMethodFormattedName,
          unitPrice: row.matchedUnitPrice!,
          sortOrder: idx + 1,
          specimenTypeId: row.matchedSpecimenTypeId,
          specimenTypeName: row.matchedSpecimenTypeName,
        })
      );

      newSamples.push({
        key: sampleKey,
        sortOrder,
        sampleName,
        quantity: group.quantity,
        indicators,
      });
    });

    onImport(newSamples);
    message.success(
      `Đã import ${newSamples.length} mẫu với ${matchedRows.length} chỉ tiêu`
    );
    handleReset();
  };

  const handleReset = () => {
    setParsedRows([]);
    setStep("upload");
  };

  const handleClose = () => {
    handleReset();
    onCancel();
  };

  const handleDownloadTemplate = () => {
    window.open(TEMPLATE_URL, "_blank");
  };

  const matchedCount = parsedRows.filter((r) => r.matched).length;
  const unmatchedCount = parsedRows.filter((r) => !r.matched).length;

  const columns: ColumnsType<ParsedRow> = [
    {
      title: "STT",
      dataIndex: "rowIndex",
      key: "rowIndex",
      width: 55,
      align: "center",
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 140,
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 50,
      align: "center",
    },
    {
      title: "Nền mẫu",
      dataIndex: "specimenTypeName",
      key: "specimenTypeName",
      width: 120,
      render: (val: string, record: ParsedRow) =>
        record.matched && record.matchedSpecimenTypeName
          ? record.matchedSpecimenTypeName
          : val || "-",
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
    },
    {
      title: "Phương pháp",
      key: "testMethodName",
      width: 150,
      ellipsis: true,
      render: (_: any, record: ParsedRow) =>
        record.matched ? record.matchedTestMethodName : "-",
    },
    {
      title: "Đơn giá",
      key: "unitPrice",
      width: 110,
      align: "right",
      render: (_: any, record: ParsedRow) =>
        record.matched ? formatCurrency(record.matchedUnitPrice!) : "-",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      align: "center",
      render: (_: any, record: ParsedRow) =>
        record.matched ? (
          <Tag color="success">OK</Tag>
        ) : (
          <Tag color="error">{record.errorMessage || "Lỗi"}</Tag>
        ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined />
          <span>Import danh sách mẫu từ Excel</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={1000}
      centered
      footer={
        step === "preview" ? (
          <Space>
            <Button onClick={handleReset}>Chọn file khác</Button>
            <Button onClick={handleClose}>Hủy</Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleConfirm}
              disabled={matchedCount === 0}
            >
              Nhập {matchedCount} chỉ tiêu
            </Button>
          </Space>
        ) : null
      }
    >
      <Spin spinning={loading}>
        {step === "upload" && (
          <div>
            <div style={{ marginBottom: 16, textAlign: "right" }}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                size="small"
              >
                Tải file mẫu
              </Button>
            </div>
            <Upload.Dragger
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
            >
              <p className="ant-upload-drag-icon">
                <FileExcelOutlined
                  style={{ fontSize: 48, color: "#52c41a" }}
                />
              </p>
              <p className="ant-upload-text">
                Kéo thả file Excel vào đây hoặc click để chọn
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ file .xlsx, .xls với các cột: Tên mẫu, Số lượng, Nền
                mẫu, Chỉ tiêu
              </p>
            </Upload.Dragger>
          </div>
        )}

        {step === "preview" && (
          <>
            <Alert
              type={unmatchedCount > 0 ? "warning" : "success"}
              message={
                unmatchedCount > 0
                  ? `${matchedCount} chỉ tiêu hợp lệ, ${unmatchedCount} không tìm thấy (sẽ bỏ qua khi import)`
                  : `Tất cả ${matchedCount} chỉ tiêu đều hợp lệ`
              }
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={parsedRows}
              rowKey="key"
              size="small"
              scroll={{ y: 400 }}
              pagination={false}
              rowClassName={(record) => (record.matched ? "" : "ant-table-row-error")}
            />
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default ImportQuotationSamplesModal;
