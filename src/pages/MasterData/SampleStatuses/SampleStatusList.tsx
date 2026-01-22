import React, { useMemo, useEffect, useRef } from "react";
import { Button, Row, Col } from "antd";
import { PlusOutlined } from "../../../components/common/Icon";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSampleConditionData, useSampleConditionActions } from "./hooks";
import { StatusTable, StatusModal } from "./components";
import { getConditionColumns } from "./constants";
import { SampleConditionTabProps } from "./types";
import { sampleConditionSchema, SampleConditionFormData } from "./schemas";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

const SampleConditionList: React.FC<SampleConditionTabProps> = ({
  onDataChange,
  refreshKey,
}) => {
  const {
    loading,
    searchText,
    filteredConditions,
    setSearchText,
    fetchData,
  } = useSampleConditionData();

  // Refresh data when refreshKey changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (refreshKey !== undefined) {
      fetchData();
    }
  }, [refreshKey]);

  const {
    modalOpen,
    editingCondition,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  } = useSampleConditionActions({
    fetchData,
    onDataChange,
  });

  const form = useForm<SampleConditionFormData>({
    resolver: yupResolver(sampleConditionSchema) as any,
    defaultValues: { name: "", description: "", isActive: true },
  });

  // Memoized columns
  const conditionColumns = useMemo(
    () =>
      getConditionColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive
      ),
    [handleEdit, handleDelete, handleToggleActive, form]
  );

  return (
    <>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="auto" />
        <Col>
          {authService.hasPermission(PERMISSIONS.MasterData.Create) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreate(form)}
            >
              Thêm tình trạng mẫu
            </Button>
          )}
        </Col>
      </Row>

      {/* Condition Table */}
      <StatusTable
        loading={loading}
        data={filteredConditions}
        columns={conditionColumns}
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* Condition Modal */}
      <StatusModal
        open={modalOpen}
        loading={modalLoading}
        editingCondition={editingCondition}
        form={form}
        onOk={(data) => handleModalOk(data, form)}
        onCancel={() => handleModalCancel(form)}
      />
    </>
  );
};

export default SampleConditionList;
