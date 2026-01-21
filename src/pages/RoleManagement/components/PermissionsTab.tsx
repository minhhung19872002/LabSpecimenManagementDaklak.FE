import React, { useState, useEffect, useMemo } from 'react';
import { Button, Checkbox, Collapse, Space, Spin, Typography, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { PermissionGroupDto } from '../../../services/roleManagementService';

const { Text } = Typography;

interface PermissionsTabProps {
  permissionGroups: PermissionGroupDto[];
  loading: boolean;
  saving: boolean;
  onSave: (permissions: string[]) => Promise<boolean>;
  isStatic?: boolean;
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({
  permissionGroups,
  loading,
  saving,
  onSave,
  isStatic = false,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize selected permissions from props
  useEffect(() => {
    const initialPermissions = new Set<string>();
    permissionGroups.forEach(group => {
      group.permissions.forEach(perm => {
        if (perm.isGranted) {
          initialPermissions.add(perm.name);
        }
      });
    });
    setSelectedPermissions(initialPermissions);
    setHasChanges(false);
  }, [permissionGroups]);

  // Calculate original permissions for change detection
  const originalPermissions = useMemo(() => {
    const original = new Set<string>();
    permissionGroups.forEach(group => {
      group.permissions.forEach(perm => {
        if (perm.isGranted) {
          original.add(perm.name);
        }
      });
    });
    return original;
  }, [permissionGroups]);

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions);
    if (checked) {
      newSelected.add(permissionName);
    } else {
      newSelected.delete(permissionName);
    }
    setSelectedPermissions(newSelected);

    // Check if there are changes
    const hasChanges =
      newSelected.size !== originalPermissions.size ||
      [...newSelected].some(p => !originalPermissions.has(p)) ||
      [...originalPermissions].some(p => !newSelected.has(p));
    setHasChanges(hasChanges);
  };

  const handleGroupSelectAll = (groupName: string, checked: boolean) => {
    const group = permissionGroups.find(g => g.name === groupName);
    if (!group) return;

    const newSelected = new Set(selectedPermissions);
    group.permissions.forEach(perm => {
      if (checked) {
        newSelected.add(perm.name);
      } else {
        newSelected.delete(perm.name);
      }
    });
    setSelectedPermissions(newSelected);

    // Check if there are changes
    const hasChanges =
      newSelected.size !== originalPermissions.size ||
      [...newSelected].some(p => !originalPermissions.has(p)) ||
      [...originalPermissions].some(p => !newSelected.has(p));
    setHasChanges(hasChanges);
  };

  const isGroupAllSelected = (group: PermissionGroupDto): boolean => {
    return group.permissions.every(perm => selectedPermissions.has(perm.name));
  };

  const isGroupPartiallySelected = (group: PermissionGroupDto): boolean => {
    const selectedCount = group.permissions.filter(perm => selectedPermissions.has(perm.name)).length;
    return selectedCount > 0 && selectedCount < group.permissions.length;
  };

  const handleSave = async () => {
    const success = await onSave([...selectedPermissions]);
    if (success) {
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const collapseItems = permissionGroups.map(group => ({
    key: group.name,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Text strong>{group.displayName}</Text>
        <Checkbox
          checked={isGroupAllSelected(group)}
          indeterminate={isGroupPartiallySelected(group)}
          onChange={(e) => {
            e.stopPropagation();
            handleGroupSelectAll(group.name, e.target.checked);
          }}
          disabled={isStatic}
          onClick={(e) => e.stopPropagation()}
        >
          Chọn tất cả
        </Checkbox>
      </div>
    ),
    children: (
      <Row gutter={[16, 8]}>
        {group.permissions.map(perm => (
          <Col key={perm.name} xs={24} sm={12} md={8} lg={6}>
            <Checkbox
              checked={selectedPermissions.has(perm.name)}
              onChange={(e) => handlePermissionChange(perm.name, e.target.checked)}
              disabled={isStatic}
            >
              {perm.displayName}
            </Checkbox>
          </Col>
        ))}
      </Row>
    ),
  }));

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          {hasChanges && (
            <Text type="warning">Có thay đổi chưa được lưu</Text>
          )}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges || isStatic}
          >
            Lưu thay đổi
          </Button>
        </Space>
      </div>

      {isStatic && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
          <Text type="warning">
            Đây là nhóm quyền hệ thống, không thể chỉnh sửa quyền truy cập.
          </Text>
        </div>
      )}

      <Collapse
        items={collapseItems}
        defaultActiveKey={permissionGroups.map(g => g.name)}
        expandIconPosition="start"
      />
    </div>
  );
};

export default PermissionsTab;
