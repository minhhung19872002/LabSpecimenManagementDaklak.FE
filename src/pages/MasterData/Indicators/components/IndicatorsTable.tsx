import React from "react";
import { Table, Button, Space, Checkbox, Spin } from "antd";
import {
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { IndicatorDto, GroupedIndicatorData } from "../types";
import "./IndicatorsTable.css";

interface IndicatorsTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedIndicatorData[];
  expandedRowKeys: string[];
  selectedRowKeys: string[];
  indicators: IndicatorDto[];
  groupColumns: ColumnsType<GroupedIndicatorData>;
  indicatorColumns: ColumnsType<IndicatorDto>;
  onExpandedRowsChange: (keys: string[]) => void;
  onSelectedRowsChange: (keys: string[]) => void;
  onBatchDelete: () => void;
  onBatchDeactivate: () => void;
  onBatchActivate: () => void;
}

const IndicatorsTable: React.FC<IndicatorsTableProps> = ({
  loading,
  batchLoading,
  groupedData,
  expandedRowKeys,
  selectedRowKeys,
  indicators,
  groupColumns,
  indicatorColumns,
  onExpandedRowsChange,
  onSelectedRowsChange,
  onBatchDelete,
  onBatchDeactivate,
  onBatchActivate,
}) => {
  return (
    <Spin spinning={loading}>
      <Table
        columns={groupColumns}
        dataSource={groupedData}
        rowKey="id"
        expandable={{
          expandedRowRender: (record) => {
            // Lấy tất cả indicator ids trong group này
            const groupIndicatorIds = record.indicators.map(
              (ind: IndicatorDto) => ind.id
            );
            // Kiểm tra xem tất cả indicators trong group có được chọn không
            const allSelected =
              groupIndicatorIds.length > 0 &&
              groupIndicatorIds.every((id: string) =>
                selectedRowKeys.includes(id)
              );
            // Kiểm tra xem có một số được chọn không (trong group này)
            const someSelected = groupIndicatorIds.some((id: string) =>
              selectedRowKeys.includes(id)
            );
            // Chỉ hiển thị overlay nếu có ít nhất 1 chỉ tiêu trong group này được chọn
            const hasSelectedInThisGroup = someSelected;

            // Lấy danh sách các chỉ tiêu đã được chọn (từ tất cả các group)
            const selectedIndicators = indicators.filter((ind) =>
              selectedRowKeys.includes(ind.id)
            );
            // Kiểm tra có chỉ tiêu nào đang ngừng hoạt động không (để hiện nút Kích hoạt)
            const hasInactiveSelected = selectedIndicators.some(
              (ind) => !ind.isActive
            );
            // Kiểm tra có chỉ tiêu nào đang hoạt động không (để hiện nút Ngưng)
            const hasActiveSelected = selectedIndicators.some(
              (ind) => ind.isActive
            );

            return (
              <div style={{ position: "relative" }}>
                {hasSelectedInThisGroup && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      height: 39,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingLeft: 8,
                      paddingRight: 12,
                      zIndex: 100,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newKeys = [
                              ...new Set([
                                ...selectedRowKeys,
                                ...groupIndicatorIds,
                              ]),
                            ];
                            onSelectedRowsChange(newKeys);
                          } else {
                            const newKeys = selectedRowKeys.filter(
                              (key) => !groupIndicatorIds.includes(key)
                            );
                            onSelectedRowsChange(newKeys);
                          }
                        }}
                      />
                      <span
                        style={{
                          marginLeft: 8,
                          color: "#1890ff",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Đã chọn {selectedRowKeys.length}
                      </span>
                    </div>
                    <Space size="small">
                      {hasInactiveSelected && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={onBatchActivate}
                          loading={batchLoading}
                        >
                          Kích hoạt
                        </Button>
                      )}
                      {hasActiveSelected && (
                        <Button
                          size="small"
                          icon={<StopOutlined />}
                          onClick={onBatchDeactivate}
                          loading={batchLoading}
                        >
                          Ngưng
                        </Button>
                      )}
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={onBatchDelete}
                        loading={batchLoading}
                      >
                        Xóa
                      </Button>
                      <Button
                        size="small"
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => onSelectedRowsChange([])}
                      />
                    </Space>
                  </div>
                )}
                <Table
                  columns={indicatorColumns}
                  dataSource={record.indicators}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  rowClassName={(record) =>
                    record.parentIndicatorId ? "sub-indicator-row" : ""
                  }
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => onSelectedRowsChange(keys as string[]),
                    columnTitle: (
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newKeys = [
                              ...new Set([
                                ...selectedRowKeys,
                                ...groupIndicatorIds,
                              ]),
                            ];
                            onSelectedRowsChange(newKeys);
                          } else {
                            const newKeys = selectedRowKeys.filter(
                              (key) => !groupIndicatorIds.includes(key)
                            );
                            onSelectedRowsChange(newKeys);
                          }
                        }}
                      />
                    ),
                  }}
                />
              </div>
            );
          },
          rowExpandable: () => true,
          expandedRowKeys,
          onExpandedRowsChange: (keys) =>
            onExpandedRowsChange(keys as string[]),
        }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: [50, 100, 150],
          showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
        }}
      />
    </Spin>
  );
};

export default IndicatorsTable;
