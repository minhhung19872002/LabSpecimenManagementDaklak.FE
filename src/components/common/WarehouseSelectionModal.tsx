import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Modal,
  Tree,
  Input,
  Button,
  Space,
  Typography,
  Spin,
  Empty,
  Tag,
} from "antd";
import {
  RightOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { TreeDataNode } from "antd";
import {
  WarehouseDto,
  warehouseService,
} from "../../services/masterDataService";
import "./WarehouseSelectionModal.css";

const { Text } = Typography;

export interface WarehouseSelectionModalProps {
  open: boolean;
  onClose: () => void;
  ownerName: string;
  assignedWarehouseIds: string[];
  onSave: (warehouseIds: string[]) => Promise<boolean>;
  saving?: boolean;
}

const collectKeys = (nodes: TreeDataNode[]): string[] => {
  const keys: string[] = [];
  for (const n of nodes) {
    keys.push(n.key as string);
    if (n.children && (n.children as TreeDataNode[]).length > 0)
      keys.push(...collectKeys(n.children as TreeDataNode[]));
  }
  return keys;
};

interface SortableNode extends TreeDataNode {
  sortName: string;
  pinTop?: boolean;
}

const sortNodes = (nodes: SortableNode[]) => {
  nodes.sort((a, b) => {
    if (a.pinTop !== b.pinTop) return a.pinTop ? -1 : 1;
    return a.sortName.localeCompare(b.sortName, "vi");
  });
  for (const n of nodes)
    if (n.children && (n.children as SortableNode[]).length > 0)
      sortNodes(n.children as SortableNode[]);
};

const applyNodeProps = (nodes: TreeDataNode[], level: number, parentIsLast = false) => {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i] as any;
    if (level >= 2) n.checkable = false;
    const isLast = i === nodes.length - 1;
    const classes: string[] = [];
    if (isLast) classes.push('is-last-child');
    if (parentIsLast && level >= 2) classes.push('parent-is-last');
    if (classes.length > 0) n.className = classes.join(' ');
    const children = n.children as any[];
    if (children && children.length > 0) applyNodeProps(children, level + 1, isLast);
  }
};

const buildTree = (
  warehouses: WarehouseDto[],
  filterFn: (w: WarehouseDto) => boolean,
  nodeExtras?: (w: WarehouseDto) => Partial<TreeDataNode>,
): TreeDataNode[] => {
  const filtered = warehouses.filter(filterFn);
  const map = new Map<string, SortableNode>();
  for (const w of filtered) {
    const extras = nodeExtras?.(w);
    map.set(w.id, {
      key: w.id,
      title: extras?.title ?? w.name,
      children: [],
      sortName: w.name,
      pinTop: w.isDefault,
      disableCheckbox: extras?.disableCheckbox ?? false,
      ...(extras?.checkable === false ? { checkable: false } : {}),
    });
  }
  const roots: SortableNode[] = [];
  for (const w of filtered) {
    const node = map.get(w.id)!;
    if (w.parentWarehouseId && map.has(w.parentWarehouseId)) {
      (map.get(w.parentWarehouseId)!.children as SortableNode[]).push(node);
    } else {
      roots.push(node);
    }
  }
  sortNodes(roots);
  applyNodeProps(roots, 0);
  return roots;
};

const WarehouseSelectionModal: React.FC<WarehouseSelectionModalProps> = ({
  open,
  onClose,
  ownerName,
  assignedWarehouseIds,
  onSave,
  saving = false,
}) => {
  const [allWarehouses, setAllWarehouses] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [rightIds, setRightIds] = useState<Set<string>>(new Set());
  const [leftChecked, setLeftChecked] = useState<string[]>([]);
  const [rightChecked, setRightChecked] = useState<string[]>([]);
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await warehouseService.getActive();
        setAllWarehouses(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (!justOpened) return;
    setRightIds(new Set(assignedWarehouseIds));
    setLeftChecked([]);
    setRightChecked([]);
    setLeftSearch("");
    setRightSearch("");
  }, [open, assignedWarehouseIds]);

  const leftTreeData = useMemo(() => {
    let warehouses = allWarehouses;
    if (leftSearch.trim()) {
      const lower = leftSearch.toLowerCase();
      const matchIds = new Set<string>();
      for (const w of allWarehouses) {
        if (!w.isDefault && w.name.toLowerCase().includes(lower)) {
          matchIds.add(w.id);
          if (w.parentWarehouseId) matchIds.add(w.parentWarehouseId);
        }
      }
      warehouses = allWarehouses.filter(
        (w) => matchIds.has(w.id) || w.isDefault,
      );
    }
    const availableIds = new Set(
      warehouses.filter(w => !w.isDefault && !rightIds.has(w.id)).map(w => w.id),
    );
    const visibleIds = new Set(availableIds);
    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    for (const id of availableIds) {
      let parentId = warehouseMap.get(id)?.parentWarehouseId ?? null;
      while (parentId && !visibleIds.has(parentId)) {
        visibleIds.add(parentId);
        parentId = warehouseMap.get(parentId)?.parentWarehouseId ?? null;
      }
    }
    return buildTree(
      warehouses,
      (w) => visibleIds.has(w.id),
      (w) => {
        if (rightIds.has(w.id) || w.isDefault) {
          return { checkable: false };
        }
        return {};
      },
    );
  }, [allWarehouses, rightIds, leftSearch]);

  const rightTreeData = useMemo(() => {
    const warehouseMap = new Map(allWarehouses.map(w => [w.id, w]));
    const visibleIds = new Set<string>();
    for (const w of allWarehouses) {
      if (rightIds.has(w.id) || w.isDefault) {
        visibleIds.add(w.id);
        let parentId = w.parentWarehouseId;
        while (parentId && !visibleIds.has(parentId)) {
          visibleIds.add(parentId);
          parentId = warehouseMap.get(parentId)?.parentWarehouseId ?? null;
        }
      }
    }
    let warehouses = allWarehouses;
    if (rightSearch.trim()) {
      const lower = rightSearch.toLowerCase();
      const matchIds = new Set<string>();
      for (const w of allWarehouses) {
        if (visibleIds.has(w.id) && w.name.toLowerCase().includes(lower)) {
          matchIds.add(w.id);
          if (w.parentWarehouseId) matchIds.add(w.parentWarehouseId);
        }
      }
      warehouses = allWarehouses.filter((w) => matchIds.has(w.id));
    }
    return buildTree(
      warehouses,
      (w) => visibleIds.has(w.id),
      (w) => {
        if (w.isDefault) return { disableCheckbox: true, title: <Space><Text>{w.name}</Text><Tag color="blue">Mặc định</Tag></Space> };
        if (!rightIds.has(w.id)) return { checkable: false };
        return {};
      },
    );
  }, [allWarehouses, rightIds, rightSearch]);

  const handleAdd = useCallback(() => {
    if (leftChecked.length === 0) return;
    setRightIds((prev) => {
      const next = new Set(prev);
      const addWithDescendants = (id: string) => {
        next.add(id);
        for (const w of allWarehouses) {
          if (w.parentWarehouseId === id && !w.isDefault) {
            addWithDescendants(w.id);
          }
        }
      };
      for (const id of leftChecked) {
        addWithDescendants(id);
      }
      return next;
    });
    setLeftChecked([]);
  }, [leftChecked, allWarehouses]);

  const handleRemove = useCallback(() => {
    if (rightChecked.length === 0) return;
    setRightIds((prev) => {
      const next = new Set(prev);
      const removeWithDescendants = (parentId: string) => {
        next.delete(parentId);
        for (const w of allWarehouses) {
          if (w.parentWarehouseId === parentId) {
            removeWithDescendants(w.id);
          }
        }
      };
      for (const id of rightChecked) removeWithDescendants(id);
      return next;
    });
    setRightChecked([]);
  }, [rightChecked, allWarehouses]);

  const handleSave = async () => {
    const ids = [...rightIds];
    const success = await onSave(ids);
    if (success) onClose();
  };

  const hasChanges = useMemo(() => {
    const original = new Set(assignedWarehouseIds);
    if (rightIds.size !== original.size) return true;
    for (const id of rightIds) {
      if (!original.has(id)) return true;
    }
    return false;
  }, [rightIds, assignedWarehouseIds]);

  return (
    <Modal
      title="Cấp quyền theo kho"
      open={open}
      onCancel={onClose}
      width={900}
      centered
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Lưu
          </Button>
        </Space>
      }
      destroyOnClose
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflow: "hidden",
        },
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16, height: "min(400px, calc(100vh - 260px))" }}>
          {/* Left panel */}
          <div
            style={{
              flex: 1,
              border: "1px solid #d9d9d9",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Text strong style={{ marginBottom: 8, display: "block" }}>
              Danh sách kho
            </Text>
            <Input
              placeholder="Tìm theo tên kho..."
              prefix={<SearchOutlined />}
              allowClear
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ flex: 1, overflow: "auto" }}>
              {leftTreeData.length === 0 ? (
                <Empty
                  description="Không có kho nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Tree
                  checkable
                  treeData={leftTreeData}
                  checkedKeys={leftChecked}
                  onCheck={(checked) =>
                    setLeftChecked(checked as string[])
                  }
                  expandedKeys={collectKeys(leftTreeData)}
                  selectable={false}
                  expandAction={false}
                  switcherIcon={() => null}
                  className="warehouse-tree"
                />
              )}
            </div>
          </div>

          {/* Middle buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Button
              icon={<RightOutlined />}
              onClick={handleAdd}
              disabled={leftChecked.length === 0}
            >
              Thêm
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleRemove}
              disabled={rightChecked.length === 0}
            >
              Xóa
            </Button>
          </div>

          {/* Right panel */}
          <div
            style={{
              flex: 1,
              border: "1px solid #d9d9d9",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Text strong style={{ marginBottom: 8, display: "block" }}>
              Quyền của: {ownerName}
            </Text>
            <Input
              placeholder="Tìm trong kho đã cấp..."
              prefix={<SearchOutlined />}
              allowClear
              value={rightSearch}
              onChange={(e) => setRightSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ flex: 1, overflow: "auto" }}>
              {rightTreeData.length === 0 ? (
                <Empty
                  description="Chưa cấp kho nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Tree
                  checkable
                  treeData={rightTreeData}
                  checkedKeys={rightChecked}
                  onCheck={(checked) =>
                    setRightChecked(checked as string[])
                  }
                  expandedKeys={collectKeys(rightTreeData)}
                  selectable={false}
                  expandAction={false}
                  switcherIcon={() => null}
                  className="warehouse-tree"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WarehouseSelectionModal;
