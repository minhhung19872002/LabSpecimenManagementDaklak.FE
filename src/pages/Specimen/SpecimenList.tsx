import React from "react";
import { Card, Button, Space } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ImportOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import ImportExcelModal from "../../components/common/ImportExcelModal";
import { useSpecimenList, useSpecimenModal } from "./hooks";
import { SpecimenFilters, SpecimenTable, SpecimenModal } from "./components";

const SpecimenList: React.FC = () => {
  const {
    data,
    totalCount,
    specimenTypes,
    storageLocations,
    testRequests,
    loading,
    isFetching,
    isDeleting,
    downloadingTemplate,
    currentPage,
    pageSize,
    searchInput,
    setSearchInput,
    statusFilter,
    typeFilter,
    handleSearch,
    handleClearSearch,
    handleStatusChange,
    handleTypeChange,
    handlePageChange,
    handleDelete,
    handleDownloadTemplate,
    generateSpecimenCode,
    refetch,
  } = useSpecimenList();

  const {
    isModalOpen,
    editingItem,
    form,
    actionLoading,
    importModalOpen,
    setImportModalOpen,
    handleCreate,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleAddSpecimen,
  } = useSpecimenModal(generateSpecimenCode);

  return (
    <Card
      title="Danh sách mẫu thử nghiệm"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Làm mới
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={downloadingTemplate}
          >
            Tải Template
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setImportModalOpen(true)}
          >
            Import Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm mẫu
          </Button>
        </Space>
      }
    >
      <SpecimenFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        specimenTypes={specimenTypes}
      />

      <SpecimenTable
        data={data}
        loading={loading || isFetching}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        isDeleting={isDeleting}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SpecimenModal
        open={isModalOpen}
        editingItem={editingItem}
        form={form}
        loading={actionLoading || isFetching}
        specimenTypes={specimenTypes}
        storageLocations={storageLocations}
        testRequests={testRequests}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        onAddSpecimen={handleAddSpecimen}
      />

      <ImportExcelModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          refetch();
        }}
        importType="specimens"
        title="Import mẫu thử nghiệm"
      />
    </Card>
  );
};

export default SpecimenList;
