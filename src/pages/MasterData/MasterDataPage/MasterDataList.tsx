// @ts-nocheck
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Button, Space, Tag, Alert, Tabs, Form, Empty, message } from "antd";
import {
  PlusOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  UploadOutlined,
  FolderAddOutlined,
} from "../../../components/common/Icon";
import ImportExcelModal from "../../../components/common/ImportExcelModal";
import ImportWarehouseModal, {
  type WarehouseImportPreviewDto,
} from "./components/ImportWarehouseModal";
import ImportManufacturerModal, {
  type ManufacturerImportPreviewDto,
} from "./components/ImportManufacturerModal";
import ImportUnitModal, {
  type UnitImportPreviewDto,
} from "./components/ImportUnitModal";
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
import UnitsTab, { type UnitActions } from "../Units";
import ProductCatalogTab, { type ProductCatalogActions } from "../ProductCatalog";
import ImportProductMasterDataModal from "./components/ImportProductMasterDataModal";
import { useMasterDataState } from "./hooks";
import { useMasterDataActions } from "./hooks/useMasterDataActions";
import {
  MasterDataTable,
  MasterDataModal,
  StatisticsCards,
  AsyncDropdownButton,
} from "./components";
import {
  categoryLabels,
  categoryPermissionMap,
  importTypeMap,
  getColumns,
  getStatCount,
} from "./constants";
import { MasterDataItem } from "./types";
import { importService } from "../../../services/importService";
import type { UploadFile } from "antd/es/upload/interface";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import "../../../styles/ListCard.css";
import "../MasterData.css";

const MasterDataList: React.FC = () => {
  const visibleCategories = useMemo(
    () =>
      Object.entries(categoryLabels).filter(([key]) => {
        const requiredPermission = categoryPermissionMap[key];
        return requiredPermission
          ? authService.hasPermission(requiredPermission)
          : false;
      }),
    [],
  );

  const firstVisibleCategory = visibleCategories[0]?.[0] ?? "";

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
  } = useMasterDataState(firstVisibleCategory);

  const {
    canImport,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleToggleActive,
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
  const [unitsRefreshKey, setUnitsRefreshKey] = useState(0);
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);

  // Warehouse import state
  const [warehouseImportOpen, setWarehouseImportOpen] = useState(false);
  const [warehouseImportLoading, setWarehouseImportLoading] = useState(false);
  const [warehouseImportFileList, setWarehouseImportFileList] = useState<UploadFile[]>([]);
  const [warehouseImportPreview, setWarehouseImportPreview] = useState<WarehouseImportPreviewDto | null>(null);

  // Manufacturer import state
  const [manufacturerImportOpen, setManufacturerImportOpen] = useState(false);
  const [manufacturerImportLoading, setManufacturerImportLoading] = useState(false);
  const [manufacturerImportFileList, setManufacturerImportFileList] = useState<UploadFile[]>([]);
  const [manufacturerImportPreview, setManufacturerImportPreview] = useState<ManufacturerImportPreviewDto | null>(null);

  // Unit import state
  const [unitImportOpen, setUnitImportOpen] = useState(false);
  const [unitImportLoading, setUnitImportLoading] = useState(false);
  const [unitImportFileList, setUnitImportFileList] = useState<UploadFile[]>([]);
  const [unitImportPreview, setUnitImportPreview] = useState<UnitImportPreviewDto | null>(null);

  const handleWarehouseImportPreview = async () => {
    if (!warehouseImportFileList.length || !warehouseImportFileList[0].originFileObj) {
      return;
    }
    setWarehouseImportLoading(true);
    try {
      const result = await importService.previewWarehouses(warehouseImportFileList[0].originFileObj);
      setWarehouseImportPreview(result);
    } catch (err: unknown) {
      console.error("Failed to preview warehouse import:", err);
      message.error("Không thể xem trước dữ liệu import");
    } finally {
      setWarehouseImportLoading(false);
    }
  };

  const handleWarehouseImportConfirm = async () => {
    if (!warehouseImportFileList.length || !warehouseImportFileList[0].originFileObj) {
      return;
    }
    setWarehouseImportLoading(true);
    try {
      const result = await importService.importWarehouses(warehouseImportFileList[0].originFileObj);
      if (result.success) {
        message.success(result.message || "Import thành công");
        setWarehouseImportOpen(false);
        setWarehouseImportFileList([]);
        setWarehouseImportPreview(null);
        fetchCategoryData(activeCategory, true);
        fetchStatistics();
      } else {
        message.error(result.message || "Import thất bại");
      }
    } catch (err: unknown) {
      console.error("Failed to import warehouses:", err);
      message.error("Không thể import dữ liệu");
    } finally {
      setWarehouseImportLoading(false);
    }
  };

  const handleWarehouseImportCancel = () => {
    setWarehouseImportOpen(false);
    setWarehouseImportFileList([]);
    setWarehouseImportPreview(null);
  };

  const handleWarehouseImportReset = () => {
    setWarehouseImportFileList([]);
    setWarehouseImportPreview(null);
  };

  const handleManufacturerImportPreview = async () => {
    if (!manufacturerImportFileList.length || !manufacturerImportFileList[0].originFileObj) {
      return;
    }
    setManufacturerImportLoading(true);
    try {
      const result = await importService.previewManufacturers(manufacturerImportFileList[0].originFileObj);
      setManufacturerImportPreview(result);
    } catch (err: unknown) {
      console.error("Failed to preview manufacturer import:", err);
      message.error("Không thể xem trước dữ liệu import");
    } finally {
      setManufacturerImportLoading(false);
    }
  };

  const handleManufacturerImportConfirm = async () => {
    if (!manufacturerImportFileList.length || !manufacturerImportFileList[0].originFileObj) {
      return;
    }
    setManufacturerImportLoading(true);
    try {
      const result = await importService.importManufacturers(manufacturerImportFileList[0].originFileObj);
      if (result.success) {
        message.success(result.message || "Import thành công");
        setManufacturerImportOpen(false);
        setManufacturerImportFileList([]);
        setManufacturerImportPreview(null);
        fetchCategoryData(activeCategory, true);
        fetchStatistics();
      } else {
        message.error(result.message || "Import thất bại");
      }
    } catch (err: unknown) {
      console.error("Failed to import manufacturers:", err);
      message.error("Không thể import dữ liệu");
    } finally {
      setManufacturerImportLoading(false);
    }
  };

  const handleManufacturerImportCancel = () => {
    setManufacturerImportOpen(false);
    setManufacturerImportFileList([]);
    setManufacturerImportPreview(null);
  };

  const handleManufacturerImportReset = () => {
    setManufacturerImportFileList([]);
    setManufacturerImportPreview(null);
  };

  const handleUnitImportPreview = async () => {
    if (!unitImportFileList.length || !unitImportFileList[0].originFileObj) {
      return;
    }
    setUnitImportLoading(true);
    try {
      const result = await importService.previewUnits(unitImportFileList[0].originFileObj);
      setUnitImportPreview(result);
    } catch (err: unknown) {
      console.error("Failed to preview unit import:", err);
      message.error("Không thể xem trước dữ liệu import");
    } finally {
      setUnitImportLoading(false);
    }
  };

  const handleUnitImportConfirm = async () => {
    if (!unitImportFileList.length || !unitImportFileList[0].originFileObj) {
      return;
    }
    setUnitImportLoading(true);
    try {
      const result = await importService.importUnits(unitImportFileList[0].originFileObj);
      if (result.success) {
        message.success(result.message || "Import thành công");
        setUnitImportOpen(false);
        setUnitImportFileList([]);
        setUnitImportPreview(null);
        setUnitsRefreshKey((prev) => prev + 1);
        fetchStatistics();
      } else {
        message.error(result.message || "Import thất bại");
      }
    } catch (err: unknown) {
      console.error("Failed to import units:", err);
      message.error("Không thể import dữ liệu");
    } finally {
      setUnitImportLoading(false);
    }
  };

  const handleUnitImportCancel = () => {
    setUnitImportOpen(false);
    setUnitImportFileList([]);
    setUnitImportPreview(null);
  };

  const handleUnitImportReset = () => {
    setUnitImportFileList([]);
    setUnitImportPreview(null);
  };

  const hasVisibleCategories = visibleCategories.length > 0;
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!hasVisibleCategories) return;
    const tabParam = searchParams.get('tab');
    if (tabParam && visibleCategories.some(([key]) => key === tabParam)) {
      setActiveCategory(tabParam);
      setSearchText("");
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, hasVisibleCategories, visibleCategories, setActiveCategory, setSearchText, setSearchParams]);

  useEffect(() => {
    if (!hasVisibleCategories) {
      return;
    }

    const activeCategoryVisible = visibleCategories.some(
      ([key]) => key === activeCategory,
    );

    if (!activeCategoryVisible) {
      setActiveCategory(firstVisibleCategory);
      setSearchText("");
    }
  }, [
    activeCategory,
    firstVisibleCategory,
    hasVisibleCategories,
    setActiveCategory,
    setSearchText,
    visibleCategories,
  ]);

  // Refs for tab actions
  const sampleConditionsRef = useRef<SampleConditionActions>(null);
  const sampleTypeCategoriesRef = useRef<SampleTypeCategoriesActions>(null);
  const specimenTypesRef = useRef<SpecimenTypesActions>(null);
  const testMethodsRef = useRef<TestMethodsActions>(null);
  const standardsRef = useRef<StandardsActions>(null);
  const indicatorsRef = useRef<IndicatorsActions>(null);
  const testResultValuesRef = useRef<TestResultValuesActions>(null);
  const notesRef = useRef<NotesActions>(null);
  const unitsRef = useRef<UnitActions>(null);
  const productCatalogRef = useRef<ProductCatalogActions>(null);
  const [productMasterImportOpen, setProductMasterImportOpen] = useState(false);
  const [exportingProductMaster, setExportingProductMaster] = useState(false);

  const handleExportProductMasterData = useCallback(async () => {
    setExportingProductMaster(true);
    try {
      const blob = await importService.exportProductMasterData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Danh_muc_vat_tu.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success("Xuất danh sách vật tư thành công");
    } catch {
      message.error("Không thể xuất danh sách vật tư");
    } finally {
      setExportingProductMaster(false);
    }
  }, []);

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
        handleToggleActive,
      ),
    [activeCategory, users, handleEdit, handleDelete, handleToggleActive, form],
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
          canCreate &&
          hasVisibleCategories && (
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
                    onClick={() =>
                      sampleTypeCategoriesRef.current?.handleImport()
                    }
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
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      specimenTypesRef.current?.handleDownloadTemplate()
                    }
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => specimenTypesRef.current?.handleImport()}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => specimenTypesRef.current?.handleCreate()}
                  >
                    Thêm loại mẫu
                  </Button>
                </>
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
                    Tải template
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
                  {authService.isAdmin() && (
                    <>
                      <AsyncDropdownButton
                        label="Tải template (Admin)"
                        icon={<DownloadOutlined />}
                        style={{ borderColor: "#faad14", color: "#faad14" }}
                        items={[
                          {
                            key: "indicator",
                            label: "Tải template chỉ tiêu",
                            icon: <DownloadOutlined />,
                            onClick: () =>
                              indicatorsRef.current?.handleDownloadAdminTemplate(),
                          },
                          {
                            key: "consumption",
                            label: "Tải template tiêu hao",
                            icon: <DownloadOutlined />,
                            onClick: () =>
                              indicatorsRef.current?.handleDownloadAdminConsumptionTemplate(),
                          },
                        ]}
                      />
                      <AsyncDropdownButton
                        label="Nhập danh sách (Admin)"
                        icon={<UploadOutlined />}
                        style={{ borderColor: "#faad14", color: "#faad14" }}
                        items={[
                          {
                            key: "indicator",
                            label: "Nhập template chỉ tiêu",
                            icon: <UploadOutlined />,
                            onClick: () => indicatorsRef.current?.handleAdminImport(),
                          },
                          {
                            key: "consumption",
                            label: "Nhập template tiêu hao",
                            icon: <UploadOutlined />,
                            onClick: () =>
                              indicatorsRef.current?.handleAdminConsumptionImport(),
                          },
                        ]}
                      />
                    </>
                  )}
                </>
              )}

              {/* Test Result Values Tab */}
              {activeCategory === "testResultValues" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      testResultValuesRef.current?.handleDownloadTemplate()
                    }
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => testResultValuesRef.current?.handleImport()}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => testResultValuesRef.current?.handleCreate()}
                  >
                    Thêm kết quả
                  </Button>
                </>
              )}

              {/* Units Tab */}
              {activeCategory === "units" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    loading={downloadingTemplate}
                    onClick={handleDownloadTemplate}
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => setUnitImportOpen(true)}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => unitsRef.current?.handleCreate()}
                  >
                    Thêm đơn vị
                  </Button>
                </>
              )}

              {/* Products Tab */}
              {activeCategory === "products" && (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => productCatalogRef.current?.handleCreate()}
                  >
                    Thêm vật tư
                  </Button>
                  {authService.isAdmin() && (
                    <>
                      <Button
                        icon={<DownloadOutlined />}
                        loading={exportingProductMaster}
                        onClick={handleExportProductMasterData}
                        style={{ borderColor: "#faad14", color: "#faad14" }}
                      >
                        Xuất danh sách vật tư
                      </Button>
                      <Button
                        icon={<UploadOutlined />}
                        onClick={() => setProductMasterImportOpen(true)}
                        style={{ borderColor: "#faad14", color: "#faad14" }}
                      >
                        Nhập danh sách vật tư
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Notes Tab */}
              {activeCategory === "notes" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => notesRef.current?.handleDownloadTemplate()}
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => notesRef.current?.handleImport()}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => notesRef.current?.handleCreate()}
                  >
                    Thêm ghi chú
                  </Button>
                </>
              )}

              {/* Warehouses Tab */}
              {activeCategory === "warehouses" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    loading={downloadingTemplate}
                    onClick={handleDownloadTemplate}
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => setWarehouseImportOpen(true)}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreate(form)}
                  >
                    Thêm mới
                  </Button>
                </>
              )}

              {/* Manufacturers Tab */}
              {activeCategory === "manufacturers" && (
                <>
                  <Button
                    icon={<DownloadOutlined />}
                    loading={downloadingTemplate}
                    onClick={handleDownloadTemplate}
                  >
                    Tải template
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => setManufacturerImportOpen(true)}
                  >
                    Nhập danh sách
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreate(form)}
                  >
                    Thêm mới
                  </Button>
                </>
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
                activeCategory !== "sampleConditions" &&
                activeCategory !== "units" &&
                activeCategory !== "products" &&
                activeCategory !== "warehouses" &&
                activeCategory !== "manufacturers" && (
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
        {hasVisibleCategories ? (
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
              if (key === "units") {
                setUnitsRefreshKey((prev) => prev + 1);
              }
              if (key === "products") {
                setProductsRefreshKey((prev) => prev + 1);
              }
            }}
            tabPosition="left"
            style={{ minHeight: 400 }}
            items={visibleCategories.map(([key, label]) => ({
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
                ) : key === "units" ? (
                  <UnitsTab
                    ref={unitsRef}
                    onDataChange={() => fetchStatistics()}
                    refreshKey={unitsRefreshKey}
                  />
                ) : key === "products" ? (
                  <ProductCatalogTab
                    ref={productCatalogRef}
                    onDataChange={() => fetchStatistics()}
                    refreshKey={productsRefreshKey}
                  />
                ) : (
                  <MasterDataTable
                    activeCategory={activeCategory}
                    loading={loading[key]}
                    filteredData={filteredData}
                    allWarehouses={data.warehouses}
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
        ) : (
          <div className="master-data-empty-state">
            <Empty description="Bạn chưa được cấp quyền truy cập dữ liệu chi tiết." />
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {hasVisibleCategories && (
        <MasterDataModal
          open={isModalOpen}
          loading={modalLoading}
          activeCategory={activeCategory}
          editingItem={editingItem}
          form={form}
          users={users}
          departments={data.departments || []}
          warehouses={data.warehouses || []}
          laboratories={data.laboratories || []}
          onOk={() => handleModalOk(form)}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
          }}
        />
      )}

      {/* Import Excel Modal (for non-warehouse categories) */}
      {hasVisibleCategories &&
        canImport &&
        importTypeMap[activeCategory] &&
        activeCategory !== "warehouses" &&
        activeCategory !== "manufacturers" && (
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

      {/* Import Warehouse Modal */}
      <ImportWarehouseModal
        open={warehouseImportOpen}
        loading={warehouseImportLoading}
        fileList={warehouseImportFileList}
        previewData={warehouseImportPreview}
        onFileListChange={setWarehouseImportFileList}
        onPreview={handleWarehouseImportPreview}
        onConfirm={handleWarehouseImportConfirm}
        onCancel={handleWarehouseImportCancel}
        onReset={handleWarehouseImportReset}
      />

      {/* Import Manufacturer Modal */}
      <ImportManufacturerModal
        open={manufacturerImportOpen}
        loading={manufacturerImportLoading}
        fileList={manufacturerImportFileList}
        previewData={manufacturerImportPreview}
        onFileListChange={setManufacturerImportFileList}
        onPreview={handleManufacturerImportPreview}
        onConfirm={handleManufacturerImportConfirm}
        onCancel={handleManufacturerImportCancel}
        onReset={handleManufacturerImportReset}
      />

      {/* Import Unit Modal */}
      <ImportUnitModal
        open={unitImportOpen}
        loading={unitImportLoading}
        fileList={unitImportFileList}
        previewData={unitImportPreview}
        onFileListChange={setUnitImportFileList}
        onPreview={handleUnitImportPreview}
        onConfirm={handleUnitImportConfirm}
        onCancel={handleUnitImportCancel}
        onReset={handleUnitImportReset}
      />
      <ImportProductMasterDataModal
        open={productMasterImportOpen}
        onClose={() => setProductMasterImportOpen(false)}
        onSuccess={() => setProductsRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default MasterDataList;
