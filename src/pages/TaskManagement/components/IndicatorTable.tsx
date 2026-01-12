import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Select,
  Button,
  Space,
  Modal,
  Form,
  Typography,
  Input,
  Tooltip,
} from "antd";
import StatusTag from "../../../components/common/StatusTag";
import type { TableRowSelection } from "antd/es/table/interface";
import { CheckOutlined, CloseOutlined } from "../../../components/common/Icon";
import { formatDate, parseResultToNumber } from "../../../utils/formatters";
import {
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
  MethodLookupDto,
  UserLookupDto,
  SampleStatus,
} from "../../../types/laboratoryTask";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import {
  standardService,
  StandardWithIndicatorsDto,
} from "../../../services/masterDataService";

const { Text } = Typography;

interface IndicatorTableProps {
  indicators: LaboratoryTaskIndicatorDto[];
  methods: MethodLookupDto[];
  technicians: UserLookupDto[];
  isAssigned: boolean; // true khi đã giao việc (lưu DB thành công)
  canEdit: boolean; // true khi task status cho phép edit (NotAssignedTechnician hoặc AssignedTechnician)
  /** Permission theo Permission Matrix - chỉ QLKT có quyền giao KTV và edit Note */
  canAssignTechnician?: boolean;
  sampleStatus?: SampleStatus; // Sample status to determine selection mode
  onMethodChange: (indicatorId: string, methodId: string) => void;
  onTechnicianChange: (indicatorId: string, technicianId: string) => void;
  onApprove: (indicatorId: string, approve: boolean, reason?: string, standardId?: string | null) => void;
  onUpdateNote?: (indicatorId: string, note: string | null) => Promise<void>;
  loading?: boolean;
  // Bulk selection props
  showCheckbox?: boolean;
  selectedIndicatorIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  // Callback để lấy standardIds cho bulk approve
  onGetStandardIds?: () => Record<string, string | null>;
  // Callback để set standardIds từ parent
  standardSelections?: Record<string, string | null>;
  onStandardChange?: (indicatorId: string, standardId: string | null) => void;
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  methods,
  technicians,
  isAssigned: _isAssigned,
  canEdit: _canEdit,
  canAssignTechnician = true, // Default true để không break existing usage
  sampleStatus,
  onMethodChange,
  onTechnicianChange,
  onApprove,
  onUpdateNote,
  loading = false,
  showCheckbox = false,
  selectedIndicatorIds = [],
  onSelectionChange,
  standardSelections = {},
  onStandardChange,
}) => {
  // Determine selection mode based on sample status
  // notStarted/assigned/pendingApproval → assignment mode (để chọn indicator giao việc)
  // Cho phép giao việc cho các chỉ tiêu chưa assign ngay cả khi có chỉ tiêu đang chờ duyệt
  const selectionMode: "approval" | "assignment" =
    sampleStatus === "notStarted" || sampleStatus === "assigned" || sampleStatus === "pendingApproval"
      ? "assignment"
      : "approval";

  // State for standards
  const [standardsWithIndicators, setStandardsWithIndicators] = useState<
    StandardWithIndicatorsDto[]
  >([]);
  const [loadingStandards, setLoadingStandards] = useState(false);

  // State for reject modal
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    indicatorId?: string;
  }>({
    visible: false,
  });
  const [rejectForm] = Form.useForm();

  // State for saving note (track which indicator is being saved)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Load standards on mount
  useEffect(() => {
    loadStandards();
  }, []);

  const loadStandards = async () => {
    setLoadingStandards(true);
    try {
      const result = await standardService.getWithIndicators();
      setStandardsWithIndicators(result);
    } catch (error) {
      console.error("Error loading standards:", error);
    } finally {
      setLoadingStandards(false);
    }
  };

  // Get standards that contain a specific indicator AND method
  const getStandardsForIndicator = useMemo(() => {
    return (indicatorId: string, methodId?: string) => {
      return standardsWithIndicators.filter((standard) =>
        standard.indicators.some(
          (si) =>
            si.indicatorId === indicatorId &&
            (!methodId || si.testMethodId === methodId)
        )
      );
    };
  }, [standardsWithIndicators]);

  // Get standard indicator info (comparison operator, allowed limit)
  const getStandardIndicatorInfo = (
    standardId: string,
    indicatorId: string,
    methodId?: string
  ) => {
    const standard = standardsWithIndicators.find((s) => s.id === standardId);
    if (!standard) return null;
    return standard.indicators.find(
      (si) =>
        si.indicatorId === indicatorId &&
        (!methodId || si.testMethodId === methodId)
    );
  };

  // Handle standard change - chỉ lưu local state, không gọi API
  const handleStandardChange = (
    indicatorId: string,
    standardId: string | undefined
  ) => {
    onStandardChange?.(indicatorId, standardId || null);
  };

  // Calculate pass/fail status
  // Text không tính được sẽ được convert sang 0 để vẫn so sánh được
  const calculatePassFail = (
    result: string | undefined,
    comparisonOperator: string | undefined,
    allowedLimit: string | undefined
  ): "pass" | "fail" | null => {
    if (!comparisonOperator || !allowedLimit) return null;
    if (!result) return null;

    // Parse result to number using parseResultToNumber
    // Supports: scientific notation ("2,0 x 10^2"), math expressions ("10^2*5+4"), plain numbers
    // Text không tính được (như "Âm tính") sẽ trả về 0
    const resultValue = parseResultToNumber(result);

    // Parse limit to number (also supports scientific notation and math expressions)
    const limitValue = parseResultToNumber(allowedLimit);

    // Both values are guaranteed to be numbers (text → 0)
    if (resultValue === null || limitValue === null) return null;

    // Compare based on operator
    switch (comparisonOperator) {
      case "<=":
        return resultValue <= limitValue ? "pass" : "fail";
      case ">=":
        return resultValue >= limitValue ? "pass" : "fail";
      case "<":
        return resultValue < limitValue ? "pass" : "fail";
      case ">":
        return resultValue > limitValue ? "pass" : "fail";
      case "=":
        return resultValue === limitValue ? "pass" : "fail";
      default:
        return null;
    }
  };

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (rejectModal.indicatorId) {
        // Lấy standardId từ local state hoặc từ indicator
        const indicator = indicators.find(i => i.id === rejectModal.indicatorId);
        const selectedStandardId = standardSelections[rejectModal.indicatorId] !== undefined
          ? standardSelections[rejectModal.indicatorId]
          : indicator?.standardId;
        onApprove(rejectModal.indicatorId, false, values.reason, selectedStandardId);
        setRejectModal({ visible: false });
        rejectForm.resetFields();
      }
    } catch (error) {
      // Validation failed
    }
  };

  // Handle save note on blur
  const handleSaveNote = async (indicatorId: string, newValue: string, originalValue: string) => {
    if (!onUpdateNote) return;

    // Nếu không thay đổi thì không gọi API
    if (newValue === originalValue) return;

    setSavingNoteId(indicatorId);
    try {
      await onUpdateNote(indicatorId, newValue || null);
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setSavingNoteId(null);
    }
  };

  const columns = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 200,
      fixed: "left" as const,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => (
        <div>
          <div>{value}</div>
          {record.indicatorGroupName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.indicatorGroupName}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Phương pháp",
      dataIndex: "methodId",
      key: "methodId",
      width: 200,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => {
        // Phương pháp đã được chọn từ TestRequest - hiển thị dạng text, không cho sửa
        if (record.methodName) {
          return (
            <Tooltip title={record.methodName}>
              <Text
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {record.methodName}
              </Text>
            </Tooltip>
          );
        }
        // Chưa có phương pháp - hiển thị dropdown để chọn
        // Cho phép chỉnh sửa nếu indicator chưa được duyệt hoặc chưa bị hủy
        const canEditMethod =
          record.approvalStatus !== IndicatorApprovalStatus.Approved &&
          record.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled;

        return (
          <Select
            style={{ width: "100%" }}
            size="small"
            value={value}
            placeholder="Chọn PP"
            onChange={(val) => onMethodChange(record.id, val)}
            options={(methods || []).map((m) => ({
              value: m.id,
              label: m.name,
            }))}
            disabled={!canEditMethod}
            allowClear
          />
        );
      },
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 120,
      render: (value: string) => {
        return <Text>{value || "-"}</Text>;
      },
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 200,
      render: (value: string) => {
        return <Text>{value || "-"}</Text>;
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 150,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => {
        // Không cho edit khi đã duyệt hoặc KH hủy hoặc không có quyền assignTechnician
        const isApproved = record.approvalStatus === IndicatorApprovalStatus.Approved;
        const isCancelled = record.approvalStatus === IndicatorApprovalStatus.CustomerCancelled;
        const canEditNote = !isApproved && !isCancelled && onUpdateNote && canAssignTechnician;
        const isSaving = savingNoteId === record.id;

        // Read-only mode
        if (!canEditNote) {
          return (
            <div style={{ minHeight: 32, display: "flex", alignItems: "center" }}>
              {value ? (
                <Tooltip title={value}>
                  <Text>{value}</Text>
                </Tooltip>
              ) : (
                <Text type="secondary">-</Text>
              )}
            </div>
          );
        }

        // Edit mode - always show Input
        return (
          <div style={{ minHeight: 32, display: "flex", alignItems: "center" }}>
            <Input
              size="small"
              defaultValue={value || ""}
              onBlur={(e) => handleSaveNote(record.id, e.target.value, value || "")}
              onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
              disabled={isSaving}
              maxLength={500}
              placeholder="Nhập ghi chú..."
              style={{ width: "100%" }}
            />
          </div>
        );
      },
    },
    {
      title: "Hình ảnh",
      key: "images",
      width: 120,
      render: (_: unknown, record: LaboratoryTaskIndicatorDto) => {
        return (
          <IndicatorImageCell
            images={record.images || []}
            canUpload={false}
            maxImages={5}
          />
        );
      },
    },
    {
      title: "So với",
      dataIndex: "standardId",
      key: "standardId",
      width: 180,
      render: (_: unknown, record: LaboratoryTaskIndicatorDto) => {
        // Ưu tiên lấy từ local state, nếu không có thì lấy từ DB
        const selectedStandardId = standardSelections[record.id] !== undefined
          ? standardSelections[record.id]
          : record.standardId;

        // Lấy danh sách tiêu chuẩn phù hợp với chỉ tiêu và phương pháp
        const availableStandards = getStandardsForIndicator(
          record.indicatorId,
          record.methodId
        );

        // Cho phép chọn tiêu chuẩn ở tất cả trạng thái trừ các trạng thái sau
        const canSelectStandard =
          record.approvalStatus !== IndicatorApprovalStatus.Approved &&
          record.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled &&
          record.approvalStatus !== IndicatorApprovalStatus.MethodChangeRequested &&
          record.approvalStatus !== IndicatorApprovalStatus.TestingRejected;

        return (
          <div style={{ minHeight: 32, display: "flex", alignItems: "center" }}>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn tiêu chuẩn"
              allowClear
              value={selectedStandardId || undefined}
              onChange={(value) => handleStandardChange(record.id, value)}
              loading={loadingStandards}
              disabled={!canSelectStandard}
              size="small"
            >
              {availableStandards.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        );
      },
    },
    {
      title: "Giới hạn",
      key: "allowedLimit",
      width: 120,
      render: (_: unknown, record: LaboratoryTaskIndicatorDto) => {
        // Ưu tiên lấy từ local state, nếu không có thì lấy từ DB
        const selectedStandardId = standardSelections[record.id] !== undefined
          ? standardSelections[record.id]
          : record.standardId;

        // Nếu đã có standardId được chọn, lấy thông tin từ standardIndicator
        if (selectedStandardId) {
          const standardInfo = getStandardIndicatorInfo(
            selectedStandardId,
            record.indicatorId,
            record.methodId
          );
          if (standardInfo) {
            const { comparisonOperator, allowedLimit } = standardInfo;
            if (comparisonOperator && allowedLimit) {
              return (
                <Text>
                  {comparisonOperator} {allowedLimit}
                </Text>
              );
            }
          }
          // Fallback to data from API if available (chỉ khi dùng standardId từ DB)
          if (selectedStandardId === record.standardId && record.comparisonOperator && record.allowedLimit) {
            return (
              <Text>
                {record.comparisonOperator} {record.allowedLimit}
              </Text>
            );
          }
        }
        return "-";
      },
    },
    {
      title: "Đạt/Không đạt",
      key: "passFailStatus",
      width: 120,
      render: (_: unknown, record: LaboratoryTaskIndicatorDto) => {
        // Ưu tiên lấy từ local state, nếu không có thì lấy từ DB
        const selectedStandardId = standardSelections[record.id] !== undefined
          ? standardSelections[record.id]
          : record.standardId;

        // Cần có standardId, kết quả, và thông tin giới hạn
        if (!selectedStandardId || !record.result) return null;

        let comparisonOperator = record.comparisonOperator;
        let allowedLimit = record.allowedLimit;

        // Lấy từ standardIndicator
        const standardInfo = getStandardIndicatorInfo(
          selectedStandardId,
          record.indicatorId,
          record.methodId
        );
        if (standardInfo) {
          comparisonOperator = standardInfo.comparisonOperator;
          allowedLimit = standardInfo.allowedLimit;
        }

        const passFailStatus = calculatePassFail(
          record.result,
          comparisonOperator,
          allowedLimit
        );

        if (passFailStatus === "pass") {
          return (
            <Text strong style={{ color: "#52c41a" }}>
              Đạt
            </Text>
          );
        } else if (passFailStatus === "fail") {
          return (
            <Text strong style={{ color: "#ff4d4f" }}>
              Không đạt
            </Text>
          );
        }
        return null;
      },
    },
    {
      title: "Kỹ thuật viên",
      dataIndex: "technicianId",
      key: "technicianId",
      width: 150,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => {
        // Cho phép chỉnh sửa KTV nếu:
        // 1. Indicator chưa được duyệt (Approved) và chưa bị hủy (CustomerCancelled)
        // 2. Có quyền assignTechnician theo Permission Matrix (chỉ QLKT)
        const canEditIndicator =
          record.approvalStatus !== IndicatorApprovalStatus.Approved &&
          record.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled &&
          canAssignTechnician;

        return (
          <div style={{ minHeight: 32, display: "flex", alignItems: "center" }}>
            <Select
              style={{ width: "100%" }}
              size="small"
              value={value}
              placeholder="Chọn KTV"
              onChange={(val) => onTechnicianChange(record.id, val)}
              options={(technicians || []).map((t) => ({
                value: t.id,
                label: t.displayName || t.userName,
              }))}
              disabled={!canEditIndicator}
              allowClear
            />
          </div>
        );
      },
    },
    {
      title: "Ngày nhập",
      dataIndex: "entryDate",
      key: "entryDate",
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: "Ngày duyệt",
      dataIndex: "approvalDate",
      key: "approvalDate",
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      width: 180,
      fixed: "right" as const,
      render: (
        status: IndicatorApprovalStatus,
        record: LaboratoryTaskIndicatorDto
      ) => {
        // Ưu tiên hiển thị "KH hủy" trước - bất kể đã giao việc hay chưa
        if (status === IndicatorApprovalStatus.CustomerCancelled) {
          return (
            <StatusTag color={IndicatorApprovalStatusColors[status]}>
              {IndicatorApprovalStatusLabels[status]}
            </StatusTag>
          );
        }

        // Kiểm tra indicator đã được giao việc (lưu vào DB) chưa
        // Dựa vào assignedDate - chỉ có khi đã lưu DB thành công
        const indicatorAssigned = !!record.assignedDate;

        // Chưa giao việc thì hiển thị tag "Chưa giao việc"
        if (!indicatorAssigned) {
          return <StatusTag color="default">Chưa giao việc</StatusTag>;
        }

        switch (status) {
          case IndicatorApprovalStatus.Pending:
            return (
              <StatusTag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </StatusTag>
            );

          case IndicatorApprovalStatus.Entered: {
            // Lấy standardId từ local state hoặc DB
            const selectedStandardIdForApprove = standardSelections[record.id] !== undefined
              ? standardSelections[record.id]
              : record.standardId;
            return (
              <Space size="small">
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() =>
                    setRejectModal({ visible: true, indicatorId: record.id })
                  }
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => onApprove(record.id, true, undefined, selectedStandardIdForApprove)}
                >
                  Duyệt
                </Button>
              </Space>
            );
          }

          case IndicatorApprovalStatus.Approved:
            return (
              <StatusTag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </StatusTag>
            );

          case IndicatorApprovalStatus.Rejected:
            return (
              <StatusTag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </StatusTag>
            );

          // CustomerCancelled đã xử lý ở đầu function

          default:
            return null;
        }
      },
    },
  ];

  // Sort indicators theo id để cố định vị trí
  const sortedIndicators = [...indicators].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  // Row selection configuration for bulk operations
  const rowSelection:
    | TableRowSelection<LaboratoryTaskIndicatorDto>
    | undefined = useMemo(() => {
    if (!showCheckbox || !onSelectionChange) return undefined;

    return {
      selectedRowKeys: selectedIndicatorIds,
      onChange: (selectedRowKeys: React.Key[]) => {
        onSelectionChange(selectedRowKeys as string[]);
      },
      getCheckboxProps: (record: LaboratoryTaskIndicatorDto) => {
        if (selectionMode === "assignment") {
          // Assignment mode: chỉ disable cho Approved và CustomerCancelled
          // Các trạng thái khác (Pending, Entered, Rejected) đều có thể chọn để giao việc
          return {
            disabled:
              record.approvalStatus === IndicatorApprovalStatus.Approved ||
              record.approvalStatus ===
                IndicatorApprovalStatus.CustomerCancelled,
            name: record.id,
          };
        }
        // Approval mode: chỉ cho phép chọn indicators có trạng thái Entered (Chờ phê duyệt) hoặc Rejected
        return {
          disabled:
            record.approvalStatus === IndicatorApprovalStatus.Approved ||
            record.approvalStatus ===
              IndicatorApprovalStatus.CustomerCancelled ||
            record.approvalStatus === IndicatorApprovalStatus.Pending,
          name: record.id,
        };
      },
    };
  }, [showCheckbox, selectedIndicatorIds, onSelectionChange, selectionMode]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={sortedIndicators}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 2170 }}
        loading={loading}
        rowSelection={rowSelection}
      />

      {/* Reject Reason Modal */}
      <Modal
        title="Lý do từ chối"
        open={rejectModal.visible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModal({ visible: false });
          rejectForm.resetFields();
        }}
        okText="Xác nhận"
        cancelText="Hủy"
        width={600}
        centered
        getContainer={false}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do từ chối kết quả..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default IndicatorTable;
