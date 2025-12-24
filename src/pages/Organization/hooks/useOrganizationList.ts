import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { organizationService } from '../../../services/organizationService';
import { OrganizationDto, CreateUpdateOrganizationDto } from '../../../types/organization';
import { getWardsByProvince, Ward } from '../../../utils/vietnamLocations';

export const useOrganizationList = () => {
  // Data state
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrganizationDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Search state
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<OrganizationDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Location state
  const [wards, setWards] = useState<Ward[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await organizationService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'sortOrder asc, name asc',
        search: searchText || undefined,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      message.error('Không thể tải danh sách. Vui lòng thử lại.');
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search handlers
  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchText('');
    setCurrentPage(1);
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  // Modal handlers
  const handleCreate = useCallback(() => {
    setModalMode('create');
    setEditingRecord(null);
    setWards([]);
    setModalVisible(true);
  }, []);

  const handleEdit = useCallback((record: OrganizationDto) => {
    setModalMode('edit');
    setEditingRecord(record);

    // Load wards based on provinceCode
    if (record.provinceCode) {
      setWards(getWardsByProvince(record.provinceCode));
    } else {
      setWards([]);
    }

    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditingRecord(null);
  }, []);

  const handleProvinceChange = useCallback((value: string) => {
    if (value) {
      setWards(getWardsByProvince(value));
    } else {
      setWards([]);
    }
  }, []);

  // CRUD handlers
  const handleSave = useCallback(async (values: CreateUpdateOrganizationDto) => {
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await organizationService.create(values);
        message.success('Tạo mới thành công!');
      } else if (editingRecord) {
        await organizationService.update(editingRecord.id, values);
        message.success('Cập nhật thành công!');
      }
      setModalVisible(false);
      loadData();
      return true;
    } catch (error: any) {
      console.error('Error saving:', error);
      message.error('Không thể lưu. Vui lòng thử lại.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [modalMode, editingRecord, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await organizationService.delete(id);
      message.success('Xóa thành công!');
      loadData();
    } catch (error: any) {
      console.error('Error deleting:', error);
      message.error('Không thể xóa. Vui lòng thử lại.');
    }
  }, [loadData]);

  return {
    // Data
    data,
    loading,
    totalCount,

    // Pagination
    currentPage,
    pageSize,
    handlePageChange,

    // Search
    searchInput,
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,

    // Modal
    modalVisible,
    modalMode,
    editingRecord,
    submitting,
    handleCreate,
    handleEdit,
    handleModalClose,

    // Location
    wards,
    handleProvinceChange,

    // Actions
    handleSave,
    handleDelete,
    loadData,
  };
};
