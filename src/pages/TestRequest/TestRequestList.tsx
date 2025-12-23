import React from "react";
import { Card } from "antd";
import ImportExcelModal from "../../components/common/ImportExcelModal";
import { useTestRequestList } from "./hooks/useTestRequestList";
import { useTestRequestActions } from "./hooks/useTestRequestActions";
import {
  TestRequestFilters,
  TestRequestTable,
  TestRequestToolbar,
} from "./components";

const TestRequestList: React.FC = () => {
  const {
    data,
    totalCount,
    loading,
    isFetching,
    searchInput,
    setSearchInput,
    statusFilter,
    dateRange,
    currentPage,
    pageSize,
    refetch,
    handleSearch,
    handleClearSearch,
    handleStatusChange,
    handleDateRangeChange,
    handlePageChange,
  } = useTestRequestList();

  const {
    importModalOpen,
    downloadingTemplate,
    isDeleting,
    handleCreate,
    handleEdit,
    handleView,
    handleDelete,
    handleDownloadTemplate,
    openImportModal,
    closeImportModal,
  } = useTestRequestActions();

  return (
    <Card
      title="Danh sách yêu cầu thử nghiệm"
      extra={
        <TestRequestToolbar
          isFetching={isFetching}
          downloadingTemplate={downloadingTemplate}
          onRefresh={refetch}
          onDownloadTemplate={handleDownloadTemplate}
          onImport={openImportModal}
          onCreate={handleCreate}
        />
      }
    >
      <TestRequestFilters
        searchInput={searchInput}
        statusFilter={statusFilter}
        dateRange={dateRange}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onStatusChange={handleStatusChange}
        onDateRangeChange={handleDateRangeChange}
      />

      <TestRequestTable
        data={data}
        loading={loading || isFetching}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        isDeleting={isDeleting}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowDoubleClick={handleView}
      />

      <ImportExcelModal
        open={importModalOpen}
        onClose={closeImportModal}
        onSuccess={() => {
          closeImportModal();
          refetch();
        }}
        importType="test-requests"
      />
    </Card>
  );
};

export default TestRequestList;