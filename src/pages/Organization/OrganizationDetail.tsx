import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Spin,
  Button,
  Collapse,
  Table,
  Tag,
  Pagination,
  DatePicker,
  Empty,
  Tooltip,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CalendarOutlined,
  FileAddOutlined,
} from "../../components/common/Icon";
import { useParams, useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { organizationService } from "../../services/organizationService";
import {
  testRequestService,
  TestRequestListParams,
} from "../../services/testRequestService";
import { OrganizationDto, CreateUpdateOrganizationDto } from "../../types/organization";
import {
  TestRequestDto,
  TestRequestStatusLabels,
  TestRequestStatusColors,
} from "../../types/testRequest";
import {
  getAllProvinces,
  getWardsByProvince,
  Ward,
} from "../../utils/vietnamLocations";
import { getSampleColumns } from "../TestRequest/columns/sampleColumns";
import SampleImagesModal from "../TestRequest/components/SampleImagesModal";
import OrganizationFormModal from "./components/OrganizationFormModal";
import { organizationSchema, OrganizationFormData } from "./schemas";
import { TestRequestSampleDto } from "../../types/testRequest";
import { PATH_ROUTES } from "../../constants/routes";
import "./OrganizationDetail.css";

const { RangePicker } = DatePicker;

const OrganizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Organization state
  const [organization, setOrganization] = useState<OrganizationDto | null>(
    null,
  );
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Location names
  const [provinceName, setProvinceName] = useState("");
  const [wardName, setWardName] = useState("");

  // Test request list state
  const [testRequests, setTestRequests] = useState<TestRequestDto[]>([]);
  const [testRequestDetails, setTestRequestDetails] = useState<
    Record<string, TestRequestDto>
  >({});
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  // Collapse state - expand all by default
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Sample images modal
  const [imagesModalVisible, setImagesModalVisible] = useState(false);
  const [selectedSample, setSelectedSample] =
    useState<TestRequestSampleDto | null>(null);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editWards, setEditWards] = useState<Ward[]>([]);
  const editForm = useForm<OrganizationFormData>({
    resolver: yupResolver(organizationSchema),
    defaultValues: { isActive: true },
  });

  // Load organization detail
  useEffect(() => {
    if (!id) return;
    const loadOrg = async () => {
      setLoadingOrg(true);
      try {
        const data = await organizationService.get(id);
        setOrganization(data);

        // Resolve province and ward names
        if (data.provinceCode) {
          const provinces = await getAllProvinces();
          const prov = provinces.find((p) => p.code === data.provinceCode);
          setProvinceName(prov?.name || data.provinceCode);

          if (data.wardCode) {
            const wards = await getWardsByProvince(data.provinceCode);
            const w = wards.find((wd: Ward) => wd.code === data.wardCode);
            setWardName(w?.name || data.wardCode);
          }
        }
      } catch (error) {
        console.error("Failed to load organization:", error);
        message.error("Không thể tải thông tin cơ sở/doanh nghiệp");
      } finally {
        setLoadingOrg(false);
      }
    };
    loadOrg();
  }, [id]);

  // Load test requests
  const loadTestRequests = useCallback(async () => {
    if (!organization) return;
    setLoadingRequests(true);
    try {
      const params: TestRequestListParams = {
        customerName: organization.name,
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "CreationTime DESC",
      };

      if (dateRange?.[0]) {
        params.fromDate = dateRange[0].startOf("day").toISOString();
      }
      if (dateRange?.[1]) {
        params.toDate = dateRange[1].endOf("day").toISOString();
      }

      const result = await testRequestService.getList(params);
      const items = result.items || [];
      setTestRequests(items);
      setTotalCount(result.totalCount || 0);

      // Expand all panels
      setActiveKeys(items.map((r) => r.id));

      // Load full details (with samples+indicators) for each test request
      const details: Record<string, TestRequestDto> = {};
      await Promise.all(
        items.map(async (tr) => {
          try {
            const detail = await testRequestService.get(tr.id);
            details[tr.id] = detail;
          } catch {
            // Keep list data as fallback
          }
        }),
      );
      setTestRequestDetails((prev) => ({ ...prev, ...details }));
    } catch (error) {
      console.error("Failed to load test requests:", error);
      message.error("Không thể tải lịch sử giao dịch");
    } finally {
      setLoadingRequests(false);
    }
  }, [organization, currentPage, pageSize, dateRange]);

  useEffect(() => {
    if (organization) {
      loadTestRequests();
    }
  }, [organization, currentPage, pageSize, dateRange, loadTestRequests]);

  // Handle date range change
  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
  ) => {
    setDateRange(dates);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Handle view sample images
  const handleViewImages = (sample: TestRequestSampleDto) => {
    setSelectedSample(sample);
    setImagesModalVisible(true);
  };

  // Sample columns for the table inside each collapse panel
  const sampleColumns = useMemo(
    () => getSampleColumns({ onViewImages: handleViewImages }),
    [],
  );

  // Handle edit - open modal
  const handleEdit = useCallback(async () => {
    if (!organization) return;
    if (organization.provinceCode) {
      const loadedWards = await getWardsByProvince(organization.provinceCode);
      setEditWards(loadedWards);
    } else {
      setEditWards([]);
    }
    editForm.reset({
      name: organization.name,
      provinceCode: organization.provinceCode,
      wardCode: organization.wardCode,
      address: organization.address,
      taxCode: organization.taxCode || null,
      contactPerson: organization.contactPerson,
      phone: organization.phone,
      secondaryPhone: organization.secondaryPhone || null,
      isActive: organization.isActive,
    });
    setEditModalVisible(true);
  }, [organization, editForm]);

  const handleEditClose = useCallback(() => {
    setEditModalVisible(false);
    editForm.reset();
  }, [editForm]);

  const handleEditProvinceChange = useCallback(
    async (value: string) => {
      if (value) {
        const loadedWards = await getWardsByProvince(value);
        setEditWards(loadedWards);
      } else {
        setEditWards([]);
      }
      editForm.setValue("wardCode", "");
    },
    [editForm],
  );

  const handleEditSave = useCallback(
    async (formData: OrganizationFormData) => {
      if (!organization) return;
      setEditSubmitting(true);
      try {
        const payload: CreateUpdateOrganizationDto = {
          name: formData.name,
          provinceCode: formData.provinceCode,
          wardCode: formData.wardCode,
          address: formData.address,
          taxCode: formData.taxCode || undefined,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          secondaryPhone: formData.secondaryPhone || undefined,
          isActive: formData.isActive,
        };
        await organizationService.update(organization.id, payload);
        message.success("Cập nhật thành công!");
        setEditModalVisible(false);
        editForm.reset();
        // Reload organization data
        const data = await organizationService.get(organization.id);
        setOrganization(data);
        // Re-resolve location names
        if (data.provinceCode) {
          const provinces = await getAllProvinces();
          const prov = provinces.find((p) => p.code === data.provinceCode);
          setProvinceName(prov?.name || data.provinceCode);
          if (data.wardCode) {
            const wards = await getWardsByProvince(data.provinceCode);
            const w = wards.find((wd: Ward) => wd.code === data.wardCode);
            setWardName(w?.name || data.wardCode);
          } else {
            setWardName("");
          }
        } else {
          setProvinceName("");
          setWardName("");
        }
      } catch (error) {
        console.error("Error saving:", error);
        message.error("Không thể lưu. Vui lòng thử lại.");
      } finally {
        setEditSubmitting(false);
      }
    },
    [organization, editForm],
  );

  // Collapse items
  const collapseItems = useMemo(
    () =>
      testRequests.map((tr) => {
        const detail = testRequestDetails[tr.id];
        const samples = detail?.samples || tr.samples || [];
        return {
          key: tr.id,
          label: (
            <div className="org-collapse-header">
              <span className="contract-number">
                <span className="contract-number-highlight">
                  {tr.contractNumber || tr.requestNumber}
                </span>
                {" - "}
                {tr.contractDate
                  ? dayjs(tr.contractDate).format("DD/MM/YYYY")
                  : tr.requestDate
                    ? dayjs(tr.requestDate).format("DD/MM/YYYY")
                    : ""}
              </span>
              <Tag color={TestRequestStatusColors[tr.status]}>
                {TestRequestStatusLabels[tr.status]}
              </Tag>
              <Button
                type="link"
                size="small"
                icon={<FileAddOutlined />}
                className="org-collapse-create-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `${PATH_ROUTES.testRequests.create}?testRequestId=${tr.id}`,
                    "_blank",
                  );
                }}
              >
                Tạo hợp đồng
              </Button>
            </div>
          ),
          children: (
            <div className="org-sample-table">
              {detail ? (
                <Table
                  dataSource={samples.filter((s) => !s.isCancelled)}
                  columns={sampleColumns}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1600 }}
                  size="small"
                  bordered
                  locale={{ emptyText: "Không có mẫu nào" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin size="small" />
                </div>
              )}
            </div>
          ),
        };
      }),
    [testRequests, testRequestDetails, sampleColumns],
  );

  if (loadingOrg) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Empty description="Không tìm thấy cơ sở/doanh nghiệp" />
      </div>
    );
  }

  return (
    <div className="org-detail-container">
      <div className="org-detail-header">
        <Tooltip title="Quay lại">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(PATH_ROUTES.organizations.index)}
          />
        </Tooltip>
        <h2>Chi tiết Cơ sở/Doanh nghiệp</h2>
      </div>

      <div className="org-detail-layout">
        {/* Left panel - sticky info card */}
        <div className="org-detail-left">
          <Card className="org-info-card" size="small">
            <div className="org-info-title">Thông tin Cơ sở/Doanh nghiệp</div>
            <div className="org-info-name">{organization.name}</div>

            <div className="org-info-row">
              <div>
                <div className="org-info-label">Tỉnh/thành</div>
                <div className="org-info-value">{provinceName || "-"}</div>
              </div>
              <div>
                <div className="org-info-label">Phường/xã</div>
                <div className="org-info-value">{wardName || "-"}</div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className="org-info-label">Địa chỉ</div>
              <div className="org-info-value">
                {organization.address || "-"}
              </div>
            </div>

            <div className="org-info-row">
              <div>
                <div className="org-info-label">Mã số thuế</div>
                <div className="org-info-value">
                  {organization.taxCode || "-"}
                </div>
              </div>
              <div>
                <div className="org-info-label">Người liên hệ</div>
                <div className="org-info-value">
                  {organization.contactPerson || "-"}
                </div>
              </div>
            </div>

            <div className="org-info-row">
              <div>
                <div className="org-info-label">Số điện thoại</div>
                <div className="org-info-value">
                  {organization.phone || "-"}
                </div>
              </div>
              <div>
                <div className="org-info-label">Số điện thoại phụ</div>
                <div className="org-info-value">
                  {organization.secondaryPhone || "-"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Chỉnh sửa
              </Button>
            </div>
          </Card>
        </div>

        {/* Right panel - transaction history */}
        <div className="org-detail-right">
          {/* History card */}
          <Card
            className="org-history-card"
            title={<span>Lịch sử giao dịch ({totalCount} phiếu yêu cầu)</span>}
            extra={
              <div className="org-history-filter">
                <CalendarOutlined style={{ color: "#8c8c8c" }} />
                <span style={{ fontSize: 13, color: "#595959", whiteSpace: "nowrap" }}>
                  Ngày hợp đồng:
                </span>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  placeholder={["Từ ngày", "Đến ngày"]}
                  allowClear
                  style={{ maxWidth: 280 }}
                />
              </div>
            }
            size="small"
          >
            <Spin spinning={loadingRequests}>
              {testRequests.length > 0 ? (
                <>
                  <Collapse
                    className="org-history-collapse"
                    activeKey={activeKeys}
                    onChange={(keys) => setActiveKeys(keys as string[])}
                    items={collapseItems}
                  />
                  <div className="org-history-pagination">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalCount}
                      pageSizeOptions={[10, 20, 50]}
                      showSizeChanger
                      showTotal={(total, range) => (
                        <>
                          Hiển thị{" "}
                          <b>
                            {range[0]}-{range[1]}/{total}
                          </b>
                        </>
                      )}
                      onChange={handlePageChange}
                    />
                  </div>
                </>
              ) : (
                <Empty
                  description="Chưa có phiếu yêu cầu nào"
                  style={{ padding: 40 }}
                />
              )}
            </Spin>
          </Card>
        </div>
      </div>

      {/* Sample Images Modal */}
      {selectedSample && (
        <SampleImagesModal
          open={imagesModalVisible}
          sample={selectedSample}
          onClose={() => {
            setImagesModalVisible(false);
            setSelectedSample(null);
          }}
        />
      )}

      {/* Edit Organization Modal */}
      <OrganizationFormModal
        visible={editModalVisible}
        mode="edit"
        form={editForm}
        submitting={editSubmitting}
        wards={editWards}
        onProvinceChange={handleEditProvinceChange}
        onSave={handleEditSave}
        onClose={handleEditClose}
      />
    </div>
  );
};

export default OrganizationDetail;
