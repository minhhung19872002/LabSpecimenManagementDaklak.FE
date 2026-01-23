// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Card, Button, Space, Tag, Alert, Tabs, Form } from "antd";
import {
  PlusOutlined,
  DatabaseOutlined,
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
} from "../../../components/common/Icon";
import ImportExcelModal from "../../../components/common/ImportExcelModal";
import IndicatorsTab from "../IndicatorsTab";
import FormTemplatesTab from "../FormTemplatesTab";
import TestMethodsTab from "../TestMethods";
import StandardsTab from "../Standards";
import TestResultValuesTab from "../TestResultValues";
import NotesTab from "../Notes";
import SpecimenTypesTab from "../SpecimenTypes";
import SampleTypeCategoriesTab from "../SampleTypeCategoriesTab";
import SampleConditionsTab from "../SampleStatuses";
import { useMasterDataState } from "./hooks";
import { useMasterDataActions } from "./hooks/useMasterDataActions";
import {
  MasterDataTable,
  MasterDataModal,
  StatisticsCards,
} from "./components";
import {
  categoryLabels,
  importTypeMap,
  getColumns,
  getStatCount,
} from "./constants";
import { MasterDataItem } from "./types";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import "../../../styles/ListCard.css";

const MasterDataList: React.FC = () => {
  const {
    activeCategory,
    data,
    totalCount,
    pagination,
    loading,
    statistics,
    statisticsLoading,
    error,
    searchText,
    isModalOpen,
    editingItem,
    modalLoading,
    importModalOpen,
    downloadingTemplate,
    users,
    currentData,
    filteredData,
    setActiveCategory,
    setSearchText,
    setIsModalOpen,
    setEditingItem,
    setModalLoading,
    setImportModalOpen,
    setDownloadingTemplate,
    setError,
    fetchStatistics,
    fetchCategoryData,
    handleTableChange,
  } = useMasterDataState();

  const {
    canImport,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleImportExcel,
    handleDownloadTemplate,
    handleExportExcel,
  } = useMasterDataActions({
    activeCategory,
    currentData,
    editingItem,
    setIsModalOpen,
    setEditingItem,
    setModalLoading,
    setImportModalOpen,
    setDownloadingTemplate,
    setError,
    fetchCategoryData,
    fetchStatistics,
  });

  const [form] = Form.useForm();
  const [testMethodsRefreshKey, setTestMethodsRefreshKey] = useState(0);
  const [standardsRefreshKey, setStandardsRefreshKey] = useState(0);
  const [specimenTypesRefreshKey, setSpecimenTypesRefreshKey] = useState(0);
  const [sampleTypeCategoriesRefreshKey, setSampleTypeCategoriesRefreshKey] = useState(0);
  const [sampleConditionsRefreshKey, setSampleConditionsRefreshKey] = useState(0);

  // Permission check - All Master Data uses unified permissions now
  const canCreate = authService.hasPermission(PERMISSIONS.MasterData.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  // Memoized columns
  const columns = useMemo(
    () =>
      getColumns(
        activeCategory,
        users,
        (record) => handleEdit(record, form),
        handleDelete
      ),
    [activeCategory, users, handleEdit, handleDelete, form]
  );

  return (
    <div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stats Cards */}
      <StatisticsCards
        statistics={statistics}
        statisticsLoading={statisticsLoading}
      />

      <Card
        className="list-card"
        title={
          <Space>
            <DatabaseOutlined />
            Ngân hàng dữ liệu (Master Data)
          </Space>
        }
        extra={
          activeCategory !== "indicators" &&
          activeCategory !== "formTemplates" &&
          activeCategory !== "testMethods" &&
          activeCategory !== "standards" &&
          activeCategory !== "testResultValues" &&
          activeCategory !== "notes" &&
          activeCategory !== "specimenTypes" &&
          activeCategory !== "sampleTypeCategories" &&
          activeCategory !== "sampleConditions" &&
          canCreate && (
            <Space>
              {/* {canImport && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  loading={downloadingTemplate}
                >
                  Tải Template
                </Button>
              )}
              <Button icon={<ImportOutlined />} onClick={handleImportExcel}>
                Import Excel
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExportExcel}>
                Export Excel
              </Button> */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreate(form)}
              >
                Thêm mới
              </Button>
            </Space>
          )
        }
      >
        <Tabs
          activeKey={activeCategory}
          onChange={(key) => {
            setActiveCategory(key);
            setSearchText("");
            // Trigger refresh when switching to testMethods, standards, or specimenTypes tab
            if (key === "testMethods") {
              setTestMethodsRefreshKey((prev) => prev + 1);
            }
            if (key === "standards") {
              setStandardsRefreshKey((prev) => prev + 1);
            }
            if (key === "specimenTypes") {
              setSpecimenTypesRefreshKey((prev) => prev + 1);
            }
            if (key === "sampleTypeCategories") {
              setSampleTypeCategoriesRefreshKey((prev) => prev + 1);
            }
            if (key === "sampleConditions") {
              setSampleConditionsRefreshKey((prev) => prev + 1);
            }
          }}
          tabPosition="left"
          style={{ minHeight: 400 }}
          items={Object.entries(categoryLabels).map(([key, label]) => ({
            key,
            label: (
              <Space>
                {label}
                <Tag>{getStatCount(key, statistics)}</Tag>
              </Space>
            ),
            children:
              key === "indicators" ? (
                <IndicatorsTab onDataChange={() => fetchStatistics()} />
              ) : key === "formTemplates" ? (
                <FormTemplatesTab />
              ) : key === "testMethods" ? (
                <TestMethodsTab
                  onDataChange={() => fetchStatistics()}
                  refreshKey={testMethodsRefreshKey}
                />
              ) : key === "standards" ? (
                <StandardsTab
                  onDataChange={() => fetchStatistics()}
                  refreshKey={standardsRefreshKey}
                />
              ) : key === "testResultValues" ? (
                <TestResultValuesTab onDataChange={() => fetchStatistics()} />
              ) : key === "notes" ? (
                <NotesTab onDataChange={() => fetchStatistics()} />
              ) : key === "specimenTypes" ? (
                <SpecimenTypesTab
                  onDataChange={() => fetchStatistics()}
                  refreshKey={specimenTypesRefreshKey}
                />
              ) : key === "sampleTypeCategories" ? (
                <SampleTypeCategoriesTab
                  onDataChange={() => fetchStatistics()}
                  refreshKey={sampleTypeCategoriesRefreshKey}
                />
              ) : key === "sampleConditions" ? (
                <SampleConditionsTab
                  onDataChange={() => fetchStatistics()}
                  refreshKey={sampleConditionsRefreshKey}
                />
              ) : (
                <MasterDataTable
                  activeCategory={activeCategory}
                  loading={loading[key]}
                  filteredData={filteredData}
                  columns={columns}
                  pagination={pagination}
                  totalCount={totalCount}
                  searchText={searchText}
                  onSearchChange={setSearchText}
                  onTableChange={handleTableChange}
                />
              ),
          }))}
        />
      </Card>

      {/* Create/Edit Modal */}
      <MasterDataModal
        open={isModalOpen}
        loading={modalLoading}
        activeCategory={activeCategory}
        editingItem={editingItem}
        form={form}
        users={users}
        departments={data.departments || []}
        onOk={() => handleModalOk(form)}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
      />

      {/* Import Excel Modal */}
      {canImport && importTypeMap[activeCategory] && (
        <ImportExcelModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onSuccess={() => {
            setImportModalOpen(false);
            fetchCategoryData(activeCategory, true);
          }}
          importType={importTypeMap[activeCategory]!}
          title={`Import ${categoryLabels[activeCategory]}`}
        />
      )}
    </div>
  );
};

export default MasterDataList;
