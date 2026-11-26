import { forwardRef, useImperativeHandle } from "react";
import { useIndicatorGroups } from "./hooks/useIndicatorGroups";
import IndicatorGroupsTable from "./components/IndicatorGroupsTable";
import { GroupModal, ImportGroupModal } from "../Indicators/components";

export interface IndicatorGroupsActions {
  handleCreate: () => void;
  handleDownloadTemplate: () => Promise<void>;
  handleImport: () => void;
}

export interface IndicatorGroupsListProps {
  onDataChange?: () => void;
}

/** Danh mục "Nhóm chỉ tiêu" — tách riêng khỏi danh mục chỉ tiêu (nhóm không bắt buộc với chỉ tiêu) */
const IndicatorGroupsList = forwardRef<IndicatorGroupsActions, IndicatorGroupsListProps>(
  ({ onDataChange }, ref) => {
    const state = useIndicatorGroups(onDataChange);

    useImperativeHandle(ref, () => ({
      handleCreate: state.handleCreate,
      handleDownloadTemplate: state.handleDownloadTemplate,
      handleImport: state.handleOpenImport,
    }));

    return (
      <>
        <IndicatorGroupsTable
          loading={state.loading}
          dataSource={state.filteredGroups}
          searchText={state.searchText}
          currentPage={state.currentPage}
          pageSize={state.pageSize}
          onSearchChange={state.handleSearchChange}
          onPageChange={state.handlePageChange}
          onEdit={state.handleEdit}
          onDelete={state.handleDelete}
        />
        <GroupModal
          open={state.groupModalOpen}
          loading={state.modalLoading}
          editingGroup={state.editingGroup}
          form={state.groupForm}
          onOk={state.handleModalOk}
          onCancel={state.handleCloseModal}
        />
        <ImportGroupModal
          open={state.importModalOpen}
          loading={state.modalLoading}
          fileList={state.importFileList}
          importResult={state.importResult}
          onFileListChange={state.setImportFileList}
          onOk={state.handleImport}
          onCancel={state.handleCloseImport}
        />
      </>
    );
  },
);

IndicatorGroupsList.displayName = "IndicatorGroupsList";

export default IndicatorGroupsList;
