import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Popconfirm,
  Tag,
  Switch,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { noteService } from "../../../services/noteService";
import { importService } from "../../../services/importService";
import { API_BASE_URL } from "../../../services/api";
import { NoteDto, CreateNoteDto, UpdateNoteDto } from "../../../types/note";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import MasterDataHistoryButton from "../../../components/common/MasterDataHistory/MasterDataHistoryButton";
import { NotesTabProps, NotesActions, NoteImportPreviewDto } from "./types";
import ImportNoteModal from "./components/ImportNoteModal";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { stripHtmlTags } from "../../../utils/formatters";

const DEFAULT_PAGE_SIZE = 50;

const NotesList = forwardRef<NotesActions, NotesTabProps>(({ onDataChange, refreshKey }, ref) => {
  const [data, setData] = useState<NoteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [_searchText, _setSearchText] = useState("");
  const [appliedSearch, _setAppliedSearch] = useState("");
  const [statusFilter, _setStatusFilter] = useState<boolean | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<NoteDto | null>(null);
  const [form] = Form.useForm();

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);
  const [importPreviewData, setImportPreviewData] = useState<NoteImportPreviewDto | null>(null);

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

  const fetchData = useCallback(
    async (
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      search?: string,
      isActive?: boolean
    ) => {
      try {
        setLoading(true);
        const result = await noteService.getList({
          skipCount: (page - 1) * pageSize,
          maxResultCount: pageSize,
          sorting: "sortOrder asc, creationTime desc",
          search: search || undefined,
          isActive: isActive,
        });
        setData(result.items);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.totalCount,
        });
      } catch (err: unknown) {
        console.error("Failed to fetch notes:", err);
        message.error("Không thể tải danh sách ghi chú");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(1, pagination.pageSize, appliedSearch, statusFilter);
  }, [appliedSearch, statusFilter]);

  // const _handleSearch = () => {
  //   _setAppliedSearch(_searchText);
  // };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    fetchData(
      paginationConfig.current || 1,
      paginationConfig.pageSize,
      appliedSearch,
      statusFilter
    );
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 0 });
    setModalOpen(true);
  };

  const handleEdit = (record: NoteDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      content: record.content,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await noteService.delete(id);
      message.success("Đã xóa ghi chú");
      fetchData(pagination.current, pagination.pageSize, appliedSearch, statusFilter);
      onDataChange?.();
    } catch (err: unknown) {
      console.error("Failed to delete:", err);
      message.error("Không thể xóa ghi chú");
    }
  };

  const handleToggleActive = async (record: NoteDto) => {
    try {
      await noteService.toggleActive(record.id);
      message.success(
        record.isActive ? "Đã vô hiệu hóa ghi chú" : "Đã kích hoạt ghi chú"
      );
      fetchData(pagination.current, pagination.pageSize, appliedSearch, statusFilter);
      onDataChange?.();
    } catch (err: unknown) {
      console.error("Failed to toggle active:", err);
      message.error("Không thể thay đổi trạng thái");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      if (editingItem) {
        const input: UpdateNoteDto = {
          content: values.content,
          isActive: values.isActive,
          sortOrder: values.sortOrder || 0,
        };
        await noteService.update(editingItem.id, input);
        message.success("Đã cập nhật ghi chú");
      } else {
        const input: CreateNoteDto = {
          content: values.content,
          isActive: values.isActive,
          sortOrder: values.sortOrder || 0,
        };
        await noteService.create(input);
        message.success("Đã thêm ghi chú mới");
      }

      setModalOpen(false);
      form.resetFields();
      fetchData(pagination.current, pagination.pageSize, appliedSearch, statusFilter);
      onDataChange?.();
    } catch (err: unknown) {
      console.error("Failed to save:", err);
      const error = err as { errorFields?: unknown; response?: { data?: { general?: string[]; server?: string[]; message?: string } }; message?: string };
      if (error.errorFields) {
        return;
      }
      const responseData = error?.response?.data;
      let errorMessage = "Không thể lưu ghi chú";

      if (responseData?.general?.[0]) {
        errorMessage = responseData.general[0];
      } else if (responseData?.server?.[0]) {
        errorMessage = responseData.server[0];
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
  };

  // Import handlers
  const handleDownloadTemplate = () => {
    window.open(
      `${API_BASE_URL}/api/v1/import/notes/template`,
      "_blank"
    );
  };

  const handleImport = () => {
    setImportModalOpen(true);
  };

  const handleImportPreview = async () => {
    if (!importFileList.length || !importFileList[0].originFileObj) {
      message.error("Vui lòng chọn file");
      return;
    }

    setImportLoading(true);
    try {
      const result = await importService.previewNotes(importFileList[0].originFileObj);
      setImportPreviewData(result);
    } catch (err: unknown) {
      console.error("Failed to preview import:", err);
      message.error("Không thể xem trước dữ liệu import");
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFileList.length || !importFileList[0].originFileObj) {
      message.error("Vui lòng chọn file");
      return;
    }

    setImportLoading(true);
    try {
      const result = await importService.importNotes(importFileList[0].originFileObj);
      if (result.success) {
        message.success(result.message || "Import thành công");
        setImportModalOpen(false);
        setImportFileList([]);
        setImportPreviewData(null);
        fetchData(1, pagination.pageSize, appliedSearch, statusFilter);
        onDataChange?.();
      } else {
        message.error(result.message || "Import thất bại");
      }
    } catch (err: unknown) {
      console.error("Failed to import:", err);
      message.error("Không thể import dữ liệu");
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCancel = () => {
    setImportModalOpen(false);
    setImportFileList([]);
    setImportPreviewData(null);
  };

  const handleImportReset = () => {
    setImportFileList([]);
    setImportPreviewData(null);
  };

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleCreate,
    handleDownloadTemplate,
    handleImport,
  }));

  const canEdit = authService.hasPermission(PERMISSIONS.Notes.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.Notes.Delete);

  const columns: ColumnsType<NoteDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      render: (content: string) => (
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ wordBreak: "break-word" }}
          className="note-content-cell"
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean, record) => (
        <Tag
          color={isActive ? "green" : "default"}
          style={{ cursor: canEdit ? "pointer" : "default" }}
          onClick={() => canEdit && handleToggleActive(record)}
        >
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <MasterDataHistoryButton
            entityType="notes"
            entityId={record.id}
            title={record.code}
          />
          {canEdit && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          )}
          {canDelete && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
          pageSizeOptions: [50, 100, 150],
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: "Không có ghi chú nào",
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? "Chỉnh sửa ghi chú" : "Thêm ghi chú mới"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        okText={editingItem ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        destroyOnHidden
        centered
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="Nội dung ghi chú"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || !stripHtmlTags(value)) {
                    return Promise.reject("Vui lòng nhập nội dung ghi chú");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <RichTextEditor
              placeholder="Nhập nội dung ghi chú..."
              showToolbar
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Không hoạt động"
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .note-content-cell p { margin: 0; }
        .note-content-cell ul, .note-content-cell ol { margin: 2px 0; padding-left: 20px; }
        .note-content-cell li { line-height: 22px; }
      `}</style>

      {/* Import Modal */}
      <ImportNoteModal
        open={importModalOpen}
        loading={importLoading}
        fileList={importFileList}
        previewData={importPreviewData}
        onFileListChange={setImportFileList}
        onPreview={handleImportPreview}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
        onReset={handleImportReset}
      />
    </>
  );
});

NotesList.displayName = "NotesList";

export default NotesList;
