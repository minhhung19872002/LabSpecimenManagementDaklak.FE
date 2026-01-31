// @ts-nocheck
import React, { useMemo, useState, useRef } from "react";
import { Card, Button, Space, Tag, Alert, Tabs, Form } from "antd";
import {
  PlusOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  UploadOutlined,
  FolderAddOutlined,
} from "../../../components/common/Icon";
import ImportExcelModal from "../../../components/common/ImportExcelModal";
import IndicatorsTab, { type IndicatorsActions } from "../Indicators";
import FormTemplatesTab from "../FormTemplatesTab";
import TestMethodsTab, { type TestMethodsActions } from "../TestMethods";
import StandardsTab, { type StandardsActions } from "../Standards";
import TestResultValuesTab, {
  type TestResultValuesActions,
} from "../TestResultValues";
import NotesTab, { type NotesActions } from "../Notes";
import SpecimenTypesTab, { type SpecimenTypesActions } from "../SpecimenTypes";
import SampleTypeCategoriesTab, {
  type SampleTypeCategoriesActions,
} from "../SampleTypeCategories";
import SampleConditionsTab, {
  type SampleConditionActions,
} from "../SampleStatuses";
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
import "../MasterData.css";

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
  const [sampleTypeCategoriesRefreshKey, setSampleTypeCategoriesRefreshKey] =
    useState(0);
  const [sampleConditionsRefreshKey, setSampleConditionsRefreshKey] =
    useState(0);
  const [testResultValuesRefreshKey, setTestResultValuesRefreshKey] =
    useState(0);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);

  // Refs for tab actions
  const sampleConditionsRef = useRef<SampleConditionActions>(null);
  const sampleTypeCategoriesRef = useRef<SampleTypeCategoriesActions>(null);
  const specimenTypesRef = useRef<SpecimenTypesActions>(null);
  const testMethodsRef = useRef<TestMethodsActions>(null);
  const standardsRef = useRef<StandardsActions>(null);
  const indicatorsRef = useRef<IndicatorsActions>(null);
  const testResultValuesRef = useRef<TestResultValuesActions>(null);
  const notesRef = useRef<NotesActions>(null);

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
        handleDelete,
      ),
    [activeCategory, users, handleEdit, handleDelete, form],
  );

  return (
    <div className="master-data-page">
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
            Ngân hàng dữ liệu
          </Space>
        }
        extra={
          canCreate && (
            <Space>
              {/* Sample Conditions Tab */}
              {activeCategory === "sampleConditions" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => sampleConditionsRef.current?.handleCreate()}
                >
                  Thêm tình trạng mẫu
                </Button>
              )}

              {/* Sample Type Categories Tab */}
              {activeCategory === "sampleTypeCategories" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      sampleTypeCategoriesRef.current?.handleDownloadTemplate()
                    }
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => sampleTypeCategoriesRef.current?.handleImport()}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      sampleTypeCategoriesRef.current?.handleCreate()
                    }
                  >
                    Thêm danh mục
                  </Button>
                </>
              )}

              {/* Specimen Types Tab */}
              {activeCategory === "specimenTypes" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => specimenTypesRef.current?.handleCreate()}
                >
                  Thêm loại mẫu
                </Button>
              )}

              {/* Test Methods Tab */}
              {activeCategory === "testMethods" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      testMethodsRef.current?.handleDownloadTemplate()
                    }
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => testMethodsRef.current?.handleImport()}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => testMethodsRef.current?.handleCreate()}
                  >
                    Thêm phương pháp
                  </Button>
                </>
              )}

              {/* Standards Tab */}
              {activeCategory === "standards" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      standardsRef.current?.handleDownloadTemplate()
                    }
                  >
                    Tải template mẫu
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => standardsRef.current?.handleImport()}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => standardsRef.current?.handleCreate()}
                  >
                    Thêm tiêu chuẩn
                  </Button>
                </>
              )}

              {/* Indicators Tab */}
              {activeCategory === "indicators" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      indicatorsRef.current?.handleDownloadTemplate()
                    }
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => indicatorsRef.current?.handleImport()}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    icon={<FolderAddOutlined />}
                    onClick={() => indicatorsRef.current?.handleCreateGroup()}
                  >
                    Thêm nhóm
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => indicatorsRef.current?.handleBulkCreate()}
                  >
                    Thêm chỉ tiêu
                  </Button>
                </>
              )}

              {/* Test Result Values Tab */}
              {activeCategory === "testResultValues" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => testResultValuesRef.current?.handleCreate()}
                >
                  Thêm kết quả
                </Button>
              )}

              {/* Notes Tab */}
              {activeCategory === "notes" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => notesRef.current?.handleCreate()}
                >
                  Thêm ghi chú
                </Button>
              )}

              {/* Other tabs (departments, laboratories, etc.) - use old handleCreate */}
              {activeCategory !== "indicators" &&
                activeCategory !== "formTemplates" &&
                activeCategory !== "testMethods" &&
                activeCategory !== "standards" &&
                activeCategory !== "testResultValues" &&
                activeCategory !== "notes" &&
                activeCategory !== "specimenTypes" &&
                activeCategory !== "sampleTypeCategories" &&
                activeCategory !== "sampleConditions" && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreate(form)}
                  >
                    Thêm mới
                  </Button>
                )}
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
            if (key === "testResultValues") {
              setTestResultValuesRefreshKey((prev) => prev + 1);
            }
            if (key === "notes") {
              setNotesRefreshKey((prev) => prev + 1);
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
                <IndicatorsTab
                  ref={indicatorsRef}
                  onDataChange={() => fetchStatistics()}
                />
              ) : key === "formTemplates" ? (
                <FormTemplatesTab />
              ) : key === "testMethods" ? (
                <TestMethodsTab
                  ref={testMethodsRef}
                  onDataChange={() => fetchStatistics()}
                  refreshKey={testMethodsRefreshKey}
                />
              ) : key === "standards" ? (
                <StandardsTab
                  ref={standardsRef}
                  onDataChange={() => fetchStatistics()}
                  refreshKey={standardsRefreshKey}
                />
              ) : key === "testResultValues" ? (
                <TestResultValuesTab
                  ref={testResultValuesRef}
                  onDataChange={() => fetchStatistics()}
                  refreshKey={testResultValuesRefreshKey}
                />
              ) : key === "notes" ? (
                <NotesTab
                  ref={notesRef}
                  onDataChange={() => fetchStatistics()}
                  refreshKey={notesRefreshKey}
                />
              ) : key === "specimenTypes" ? (
                <SpecimenTypesTab
                  ref={specimenTypesRef}
                  onDataChange={() => fetchStatistics()}
                  refreshKey={specimenTypesRefreshKey}
                />
              ) : key === "sampleTypeCategories" ? (
                <SampleTypeCategoriesTab
                  ref={sampleTypeCategoriesRef}
                  onDataChange={() => fetchStatistics()}
                  refreshKey={sampleTypeCategoriesRefreshKey}
                />
              ) : key === "sampleConditions" ? (
                <SampleConditionsTab
                  ref={sampleConditionsRef}
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
