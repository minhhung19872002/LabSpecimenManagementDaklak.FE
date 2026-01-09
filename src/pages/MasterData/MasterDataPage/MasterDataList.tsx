// @ts-nocheck
import React, { useMemo, useState, useCallback } from "react";
import { Card, Button, Space, Tag, Alert, Tabs, Form } from "antd";
import {
  PlusOutlined,
  DatabaseOutlined,
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import ImportExcelModal from "../../../components/common/ImportExcelModal";
import IndicatorsTab from "../IndicatorsTab";
import FormTemplatesTab from "../FormTemplatesTab";
import TestMethodsTab from "../TestMethods";
import StandardsTab from "../Standards";
import TestResultValuesTab from "../TestResultValues";
import NotesTab from "../Notes";
import { useMasterDataState } from "./hooks";
import { useMasterDataActions } from "./hooks/useMasterDataActions";
import {
  MasterDataTable,
  MasterDataModal,
  StatisticsCards,
  SpecimenTypeIndicatorModal,
} from "./components";
import {
  categoryLabels,
  importTypeMap,
  getColumns,
  getStatCount,
} from "./constants";
import { SpecimenTypeWithIndicatorsDto } from "../../../services/masterDataService";
import { MasterDataItem } from "./types";

const MasterDataList: React.FC = () => {
  const {
    activeCategory,
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

  // State for SpecimenType Indicator Modal
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [selectedSpecimenType, setSelectedSpecimenType] =
    useState<SpecimenTypeWithIndicatorsDto | null>(null);

  // Handle manage indicators for specimen type
  const handleManageIndicators = useCallback((record: MasterDataItem) => {
    // Cast to SpecimenTypeWithIndicatorsDto (indicators will be loaded by modal)
    setSelectedSpecimenType(record as SpecimenTypeWithIndicatorsDto);
    setIndicatorModalOpen(true);
  }, []);

  // Handle indicator modal data change
  const handleIndicatorDataChange = useCallback(() => {
    fetchCategoryData(activeCategory, true);
    fetchStatistics();
  }, [activeCategory, fetchCategoryData, fetchStatistics]);

  // Memoized columns
  const columns = useMemo(
    () =>
      getColumns(
        activeCategory,
        users,
        (record) => handleEdit(record, form),
        handleDelete,
        handleManageIndicators
      ),
    [activeCategory, users, handleEdit, handleDelete, form, handleManageIndicators]
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
          activeCategory !== "notes" && (
            <Space>
              {canImport && (
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
              </Button>
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
            // Trigger refresh when switching to testMethods or standards tab
            if (key === "testMethods") {
              setTestMethodsRefreshKey((prev) => prev + 1);
            }
            if (key === "standards") {
              setStandardsRefreshKey((prev) => prev + 1);
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

      {/* Specimen Type Indicator Modal */}
      <SpecimenTypeIndicatorModal
        open={indicatorModalOpen}
        specimenType={selectedSpecimenType}
        onClose={() => {
          setIndicatorModalOpen(false);
          setSelectedSpecimenType(null);
        }}
        onDataChange={handleIndicatorDataChange}
      />
    </div>
  );
};

export default MasterDataList;
