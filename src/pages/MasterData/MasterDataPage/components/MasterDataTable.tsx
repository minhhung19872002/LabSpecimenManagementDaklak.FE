import React, { useMemo } from "react";
import { Table, Input, Row, Col, Spin } from "antd";
import { CaretRightOutlined, SearchOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { MasterDataItem } from "../types";
import { NO_PAGINATION_CATEGORIES, DEFAULT_PAGE_SIZE } from "../constants";

interface MasterDataTableProps {
  activeCategory: string;
  loading: boolean;
  filteredData: MasterDataItem[];
  allWarehouses?: MasterDataItem[];
  columns: ColumnsType<MasterDataItem>;
  pagination: Record<string, { current: number; pageSize: number }>;
  totalCount: Record<string, number>;
  searchText: string;
  onSearchChange: (value: string) => void;
  onTableChange: (page: number, pageSize: number) => void;
}

// Nests warehouses into `children` arrays by parentWarehouseId so antd Table renders them as a tree.
const buildWarehouseTree = (items: any[]): any[] => {
  const nodes = new Map(items.map((item) => [item.id, { ...item, children: [] as any[] }]));
  const roots: any[] = [];

  nodes.forEach((node) => {
    const parent = node.parentWarehouseId ? nodes.get(node.parentWarehouseId) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const annotate = (siblings: any[]) => {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
    siblings.forEach((node) => {
      if (node.children.length === 0) {
        delete node.children;
      } else {
        annotate(node.children);
      }
    });
  };
  annotate(roots);

  return roots;
};

// When searching, keep the full ancestor chain (Level 0 -> matched node) so the tree stays intact.
const buildWarehouseSearchTree = (matched: any[], all: any[]): any[] => {
  const byId = new Map(all.map((item) => [item.id, item]));
  const includedIds = new Set<string>();

  matched.forEach((item) => {
    let current: any = item;
    while (current) {
      includedIds.add(current.id);
      current = current.parentWarehouseId ? byId.get(current.parentWarehouseId) : null;
    }
  });

  return buildWarehouseTree(all.filter((item) => includedIds.has(item.id)));
};

const renderWarehouseExpandIcon = ({
  expanded,
  onExpand,
  record,
}: {
  expanded: boolean;
  onExpand: (record: MasterDataItem, event: React.MouseEvent<HTMLElement>) => void;
  record: MasterDataItem;
}) => {
  const hasChildren = Array.isArray((record as any).children) && (record as any).children.length > 0;

  if (!hasChildren) {
    return <span style={{ display: "inline-block", width: 22, marginRight: 4 }} />;
  }

  return (
    <span
      onClick={(event) => onExpand(record, event)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        marginRight: 4,
        cursor: "pointer",
        userSelect: "none",
        color: expanded ? "#1677ff" : "#4b5563",
      }}
    >
      <CaretRightOutlined
        style={{
          fontSize: 13,
          fontWeight: 700,
          transition: "transform 0.15s ease",
        }}
        rotate={expanded ? 90 : 0}
      />
    </span>
  );
};

const MasterDataTable: React.FC<MasterDataTableProps> = ({
  activeCategory,
  loading,
  filteredData,
  allWarehouses,
  columns,
  pagination,
  totalCount,
  searchText,
  onSearchChange,
  onTableChange,
}) => {
  const warehouseTreeData = useMemo(() => {
    if (activeCategory !== "warehouses") {
      return null;
    }
    return searchText
      ? buildWarehouseSearchTree(filteredData, allWarehouses || [])
      : buildWarehouseTree(filteredData);
  }, [activeCategory, filteredData, allWarehouses, searchText]);

  const dataSource = warehouseTreeData ?? filteredData;
  const defaultExpandedRowKeys = useMemo(() => {
    if (activeCategory !== "warehouses") {
      return undefined;
    }

    return (warehouseTreeData ?? [])
      .filter((item: any) => Array.isArray(item.children) && item.children.length > 0)
      .map((item: any) => item.id);
  }, [activeCategory, warehouseTreeData]);

  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading} tip="Loading data...">
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          expandable={
            activeCategory === "warehouses"
              ? {
                  defaultExpandedRowKeys,
                  indentSize: 20,
                  expandIcon: renderWarehouseExpandIcon,
                }
              : undefined
          }
          pagination={
            NO_PAGINATION_CATEGORIES.includes(activeCategory)
              ? false
              : {
                  current: pagination[activeCategory]?.current || 1,
                  pageSize:
                    pagination[activeCategory]?.pageSize || DEFAULT_PAGE_SIZE,
                  total: totalCount[activeCategory] || 0,
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
                  onChange: onTableChange,
                  onShowSizeChange: onTableChange,
                }
          }
          scroll={{
            x: activeCategory === "customers" ? 900 : 700,
          }}
        />
      </Spin>
    </>
  );
};

export default MasterDataTable;
