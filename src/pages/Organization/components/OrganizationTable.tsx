import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Space, Tag } from "antd";
import { EditOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { OrganizationDto } from "../../../types/organization";
import { getAllProvinces } from "../../../utils/vietnamLocations";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { PATH_ROUTES } from "../../../constants/routes";

interface OrganizationTableProps {
  data: OrganizationDto[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number, size: number) => void;
  onEdit: (record: OrganizationDto) => void;
}

const OrganizationTable: React.FC<OrganizationTableProps> = ({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onEdit,
}) => {
  const [provinceMap, setProvinceMap] = useState<Map<string, string>>(
    new Map(),
  );

  // Load provinces on mount and create a lookup map
  useEffect(() => {
    const loadProvinces = async () => {
      const provinces = await getAllProvinces();
      const map = new Map(provinces.map((p) => [p.code, p.name]));
      setProvinceMap(map);
    };
    loadProvinces();
  }, []);

  const columns: ColumnsType<OrganizationDto> = useMemo(
    () => [
      {
        title: "STT",
        key: "index",
        width: 60,
        align: "center",
        render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      },
      {
        title: "Tên CS/DN",
        dataIndex: "name",
        key: "name",
        width: 200,
        ellipsis: true,
      },
      {
        title: "Tỉnh thành",
        dataIndex: "provinceCode",
        key: "provinceCode",
        width: 150,
        render: (code: string) => {
          if (!code) return "-";
          // Try to get name from code, if not found, display the value as-is (legacy import data)
          const name = provinceMap.get(code);
          return name || code;
        },
      },
      {
        title: "Địa chỉ",
        dataIndex: "address",
        key: "address",
        width: 200,
        ellipsis: true,
        render: (value: string) => value || "-",
      },
      {
        title: "Người LH",
        dataIndex: "contactPerson",
        key: "contactPerson",
        width: 120,
        ellipsis: true,
        render: (value: string) => value || "-",
      },
      {
        title: "MST",
        dataIndex: "taxCode",
        key: "taxCode",
        width: 120,
        render: (value: string) => value || "-",
      },
      {
        title: "SĐT",
        dataIndex: "phone",
        key: "phone",
        width: 110,
        render: (value: string) => value || "-",
      },
      {
        title: "SĐT phụ",
        dataIndex: "secondaryPhone",
        key: "secondaryPhone",
        width: 110,
        render: (value: string) => value || "-",
      },
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        key: "isActive",
        width: 100,
        align: "center",
        render: (isActive: boolean) => (
          <Tag color={isActive ? "success" : "default"}>
            {isActive ? "Hoạt động" : "Ngừng"}
          </Tag>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "creationTime",
        key: "creationTime",
        width: 130,
        render: (date: string) =>
          date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 100,
        align: "center",
        fixed: "right",
        render: (_, record: OrganizationDto) => {
          const canEdit = authService.hasPermission(
            PERMISSIONS.MasterData.Edit,
          );

          return (
            <Space size="small">
              {canEdit && (
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              )}
            </Space>
          );
        },
      },
    ],
    [provinceMap, currentPage, pageSize, onEdit],
  );

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      onRow={(record) => ({
        onDoubleClick: () => {
          window.open(PATH_ROUTES.organizations.detail(record.id), '_blank');
        },
        style: { cursor: 'pointer' },
      })}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalCount,
        pageSizeOptions: [50, 100, 150],
        showSizeChanger: true,
        showTotal: (total, range) => (
          <>
            Hiển thị{" "}
            <b>
              {range[0]}-{range[1]}/{total}
            </b>
          </>
        ),
        onChange: onPageChange,
      }}
      scroll={{ x: 1200 }}
    />
  );
};

export default OrganizationTable;
