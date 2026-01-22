import React, { useState, useEffect, useMemo } from 'react';
import { Button, Checkbox, Collapse, Space, Spin, Typography, Row, Col, Input, Badge, Empty } from 'antd';
import { SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { PermissionGroupDto } from '../../../services/roleManagementService';
import { authService } from '../../../services/authService';
import { PERMISSIONS } from '../../../constants/permissionMapping';

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
  const [searchText, setSearchText] = useState('');

  const canEdit = authService.hasPermission(PERMISSIONS.RoleManagement.Edit);

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

  // Master Data group names (these are deprecated, now use MasterData unified permission)
  const deprecatedMasterDataGroupNames = [
    'Departments',
    'SpecimenTypes',
    'TestMethods',
    'Standards',
    'StorageLocations',
    'Customers',
    'IndicatorGroups',
    'Indicators',
    'Laboratories',
    'SampleConditions',
  ];

  // Check if using new unified MasterData permission
  const hasUnifiedMasterData = permissionGroups.some(g => g.name === 'MasterData');

  // Filter permission groups based on search text and restructure Master Data
  const filteredGroups = useMemo(() => {
    let groups = permissionGroups;

    // Apply search filter
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      groups = permissionGroups
        .map(group => {
          const matchingPermissions = group.permissions.filter(perm =>
            perm.displayName.toLowerCase().includes(lowerSearch) ||
            group.displayName.toLowerCase().includes(lowerSearch)
          );

          if (matchingPermissions.length === 0) {
            return null;
          }

          return {
            ...group,
            permissions: matchingPermissions,
          };
        })
        .filter(Boolean) as PermissionGroupDto[];
    }

    return groups;
  }, [permissionGroups, searchText]);

  // Separate Master Data groups from others
  const { masterDataGroups, otherGroups } = useMemo(() => {
    const masterData: PermissionGroupDto[] = [];
    const others: PermissionGroupDto[] = [];

    filteredGroups.forEach(group => {
      // If using new unified MasterData permission, don't nest old individual permissions
      if (hasUnifiedMasterData && deprecatedMasterDataGroupNames.includes(group.name)) {
        // Skip deprecated individual master data groups
        return;
      }

      if (deprecatedMasterDataGroupNames.includes(group.name)) {
        masterData.push(group);
      } else {
        others.push(group);
      }
    });

    return { masterDataGroups: masterData, otherGroups: others };
  }, [filteredGroups, hasUnifiedMasterData]);

  // Calculate statistics for each group
  const getGroupStats = (group: PermissionGroupDto) => {
    const total = group.permissions.length;
    const selected = group.permissions.filter(perm => selectedPermissions.has(perm.name)).length;
    return { total, selected };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Render function for a regular permission group
  const renderGroupItem = (group: PermissionGroupDto) => {
    const { total, selected } = getGroupStats(group);

    return {
      key: group.name,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16 }}>
          <Space size="small">
            <Text strong>{group.displayName}</Text>
            <Badge
              count={`${selected}/${total}`}
              style={{
                backgroundColor: selected === total ? '#52c41a' : selected > 0 ? '#1890ff' : '#d9d9d9',
                fontSize: 12,
              }}
            />
          </Space>
          <Checkbox
            checked={isGroupAllSelected(group)}
            indeterminate={isGroupPartiallySelected(group)}
            onChange={(e) => {
              e.stopPropagation();
              handleGroupSelectAll(group.name, e.target.checked);
            }}
            disabled={isStatic || !canEdit}
            onClick={(e) => e.stopPropagation()}
          >
            Chọn tất cả
          </Checkbox>
        </div>
      ),
      children: (
        <Row gutter={[16, 8]}>
          {group.permissions.map(perm => (
            <Col key={perm.name} xs={24} sm={12} md={8} lg={6} xl={4}>
              <Checkbox
                checked={selectedPermissions.has(perm.name)}
                onChange={(e) => handlePermissionChange(perm.name, e.target.checked)}
                disabled={isStatic || !canEdit}
                style={{ width: '100%' }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: selectedPermissions.has(perm.name) ? 500 : 400,
                  }}
                >
                  {perm.displayName}
                </Text>
              </Checkbox>
            </Col>
          ))}
        </Row>
      ),
    };
  };

  // Build collapse items with Master Data as nested group
  const collapseItems = useMemo(() => {
    const items = [];

    // Add regular groups first
    otherGroups.forEach(group => {
      items.push(renderGroupItem(group));
    });

    // Add Master Data parent group if there are any master data groups
    if (masterDataGroups.length > 0) {
      const totalMasterDataPerms = masterDataGroups.reduce((sum, g) => sum + g.permissions.length, 0);
      const selectedMasterDataPerms = masterDataGroups.reduce(
        (sum, g) => sum + g.permissions.filter(p => selectedPermissions.has(p.name)).length,
        0
      );

      items.push({
        key: 'MasterData',
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16 }}>
            <Space size="small">
              <Text strong>Dữ liệu chủ</Text>
              <Badge
                count={`${selectedMasterDataPerms}/${totalMasterDataPerms}`}
                style={{
                  backgroundColor: selectedMasterDataPerms === totalMasterDataPerms ? '#52c41a' : selectedMasterDataPerms > 0 ? '#1890ff' : '#d9d9d9',
                  fontSize: 12,
                }}
              />
            </Space>
          </div>
        ),
        children: (
          <div style={{ paddingLeft: 24 }}>
            {masterDataGroups.map(group => {
              const { total, selected } = getGroupStats(group);
              return (
                <div key={group.name} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text strong style={{ fontSize: 15 }}>{group.displayName}</Text>
                    <Badge
                      count={`${selected}/${total}`}
                      style={{
                        backgroundColor: selected === total ? '#52c41a' : selected > 0 ? '#1890ff' : '#d9d9d9',
                        fontSize: 11,
                      }}
                    />
                    <Checkbox
                      checked={isGroupAllSelected(group)}
                      indeterminate={isGroupPartiallySelected(group)}
                      onChange={(e) => handleGroupSelectAll(group.name, e.target.checked)}
                      disabled={isStatic || !canEdit}
                    >
                      <Text type="secondary" style={{ fontSize: 13 }}>Chọn tất cả</Text>
                    </Checkbox>
                  </div>
                  <Row gutter={[16, 8]}>
                    {group.permissions.map(perm => (
                      <Col key={perm.name} xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Checkbox
                          checked={selectedPermissions.has(perm.name)}
                          onChange={(e) => handlePermissionChange(perm.name, e.target.checked)}
                          disabled={isStatic || !canEdit}
                          style={{ width: '100%' }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: selectedPermissions.has(perm.name) ? 500 : 400,
                            }}
                          >
                            {perm.displayName}
                          </Text>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </div>
              );
            })}
          </div>
        ),
      });
    }

    return items;
  }, [otherGroups, masterDataGroups, selectedPermissions, isStatic, canEdit]);

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12} lg={14}>
          <Input
            placeholder="Tìm kiếm quyền truy cập..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
          />
        </Col>
        <Col xs={24} md={12} lg={10} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space>
            {hasChanges && (
              <Badge dot>
                <Text type="warning">Có thay đổi chưa được lưu</Text>
              </Badge>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges || isStatic || !canEdit}
              size="large"
            >
              Lưu thay đổi
            </Button>
          </Space>
        </Col>
      </Row>

      {isStatic && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6 }}>
          <Text type="warning">
            <strong>Lưu ý:</strong> Đây là nhóm quyền hệ thống, không thể chỉnh sửa quyền truy cập.
          </Text>
        </div>
      )}

      {collapseItems.length === 0 ? (
        <Empty
          description={
            searchText
              ? `Không tìm thấy quyền nào phù hợp với "${searchText}"`
              : 'Không có quyền nào'
          }
          style={{ marginTop: 48 }}
        />
      ) : (
        <Collapse
          items={collapseItems}
          activeKey={collapseItems.map(item => item.key)}
          expandIconPosition="start"
          style={{
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: 8,
          }}
        />
      )}
    </div>
  );
};

export default PermissionsTab;
