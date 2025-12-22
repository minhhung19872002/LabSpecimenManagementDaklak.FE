import React, { useState, useMemo } from "react";
import {
	Card,
	Table,
	Button,
	Space,
	Tag,
	Input,
	Row,
	Col,
	Modal,
	Form,
	Select,
	message,
	Popconfirm,
	Tabs,
	Statistic,
	Spin,
} from "antd";
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	DatabaseOutlined,
	ImportOutlined,
	ExportOutlined,
	DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
	DepartmentDto,
	SpecimenTypeDto,
	TestMethodDto,
	StorageLocationDto,
	CustomerDto,
	LaboratoryDto,
	CreateUpdateDepartmentDto,
	CreateUpdateSpecimenTypeDto,
	CreateUpdateTestMethodDto,
	CreateUpdateStorageLocationDto,
	CreateUpdateCustomerDto,
	CreateUpdateLaboratoryDto,
} from "../../services/masterDataService";
import ImportExcelModal, {
	ImportType,
} from "../../components/common/ImportExcelModal";
import {
	importService,
	downloadBlobAsFile,
} from "../../services/importService";
import IndicatorsTab from "./IndicatorsTab";
import FormTemplatesTab from "./FormTemplatesTab";

// RTK Query imports
import {
	useGetDepartmentListQuery,
	useGetLaboratoryListQuery,
	useGetSpecimenTypeListQuery,
	useGetTestMethodListQuery,
	useGetStorageLocationListQuery,
	useGetCustomerListQuery,
	useCreateDepartmentMutation,
	useUpdateDepartmentMutation,
	useDeleteDepartmentMutation,
	useCreateLaboratoryMutation,
	useUpdateLaboratoryMutation,
	useDeleteLaboratoryMutation,
	useCreateSpecimenTypeMutation,
	useUpdateSpecimenTypeMutation,
	useDeleteSpecimenTypeMutation,
	useCreateTestMethodMutation,
	useUpdateTestMethodMutation,
	useDeleteTestMethodMutation,
	useCreateStorageLocationMutation,
	useUpdateStorageLocationMutation,
	useDeleteStorageLocationMutation,
	useCreateCustomerMutation,
	useUpdateCustomerMutation,
	useDeleteCustomerMutation,
} from "../../store/api/masterDataApi";
import { useGetUserLookupQuery } from "../../store/api/userApi";

// Unified type for all master data items
type MasterDataItem =
	| DepartmentDto
	| SpecimenTypeDto
	| TestMethodDto
	| StorageLocationDto
	| CustomerDto
	| LaboratoryDto;

const categoryLabels: Record<string, string> = {
	departments: "Phòng ban",
	laboratories: "Khoa phòng",
	specimenTypes: "Loại mẫu",
	testMethods: "Phương pháp thử",
	storageLocations: "Vị trí lưu kho",
	customers: "Khách hàng",
	indicators: "Nhóm chỉ tiêu",
	formTemplates: "Form mẫu",
};

const MasterDataList: React.FC = () => {
	const [activeCategory, setActiveCategory] = useState("departments");
	const [searchText, setSearchText] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [downloadingTemplate, setDownloadingTemplate] = useState(false);
	const [form] = Form.useForm();

	// RTK Query hooks for fetching data
	const { data: departmentsData, isLoading: loadingDepartments, isFetching: fetchingDepartments } = useGetDepartmentListQuery({ maxResultCount: 1000 });
	const { data: laboratoriesData, isLoading: loadingLaboratories, isFetching: fetchingLaboratories } = useGetLaboratoryListQuery();
	const { data: specimenTypesData, isLoading: loadingSpecimenTypes, isFetching: fetchingSpecimenTypes } = useGetSpecimenTypeListQuery({ maxResultCount: 1000 });
	const { data: testMethodsData, isLoading: loadingTestMethods, isFetching: fetchingTestMethods } = useGetTestMethodListQuery({ maxResultCount: 1000 });
	const { data: storageLocationsData, isLoading: loadingStorageLocations, isFetching: fetchingStorageLocations } = useGetStorageLocationListQuery({ maxResultCount: 1000 });
	const { data: customersData, isLoading: loadingCustomers, isFetching: fetchingCustomers } = useGetCustomerListQuery({ maxResultCount: 1000 });
	const { data: users = [] } = useGetUserLookupQuery();

	// Mutations
	const [createDepartment, { isLoading: creatingDepartment }] = useCreateDepartmentMutation();
	const [updateDepartment, { isLoading: updatingDepartment }] = useUpdateDepartmentMutation();
	const [deleteDepartment] = useDeleteDepartmentMutation();

	const [createLaboratory, { isLoading: creatingLaboratory }] = useCreateLaboratoryMutation();
	const [updateLaboratory, { isLoading: updatingLaboratory }] = useUpdateLaboratoryMutation();
	const [deleteLaboratory] = useDeleteLaboratoryMutation();

	const [createSpecimenType, { isLoading: creatingSpecimenType }] = useCreateSpecimenTypeMutation();
	const [updateSpecimenType, { isLoading: updatingSpecimenType }] = useUpdateSpecimenTypeMutation();
	const [deleteSpecimenType] = useDeleteSpecimenTypeMutation();

	const [createTestMethod, { isLoading: creatingTestMethod }] = useCreateTestMethodMutation();
	const [updateTestMethod, { isLoading: updatingTestMethod }] = useUpdateTestMethodMutation();
	const [deleteTestMethod] = useDeleteTestMethodMutation();

	const [createStorageLocation, { isLoading: creatingStorageLocation }] = useCreateStorageLocationMutation();
	const [updateStorageLocation, { isLoading: updatingStorageLocation }] = useUpdateStorageLocationMutation();
	const [deleteStorageLocation] = useDeleteStorageLocationMutation();

	const [createCustomer, { isLoading: creatingCustomer }] = useCreateCustomerMutation();
	const [updateCustomer, { isLoading: updatingCustomer }] = useUpdateCustomerMutation();
	const [deleteCustomer] = useDeleteCustomerMutation();

	// Derived data
	const data = useMemo(() => ({
		departments: departmentsData?.items || [],
		laboratories: laboratoriesData || [],
		specimenTypes: specimenTypesData?.items || [],
		testMethods: testMethodsData?.items || [],
		storageLocations: storageLocationsData?.items || [],
		customers: customersData?.items || [],
		indicators: [],
	}), [departmentsData, laboratoriesData, specimenTypesData, testMethodsData, storageLocationsData, customersData]);

	const loading = useMemo(() => ({
		departments: loadingDepartments || fetchingDepartments,
		laboratories: loadingLaboratories || fetchingLaboratories,
		specimenTypes: loadingSpecimenTypes || fetchingSpecimenTypes,
		testMethods: loadingTestMethods || fetchingTestMethods,
		storageLocations: loadingStorageLocations || fetchingStorageLocations,
		customers: loadingCustomers || fetchingCustomers,
		indicators: false,
	}), [loadingDepartments, fetchingDepartments, loadingLaboratories, fetchingLaboratories, loadingSpecimenTypes, fetchingSpecimenTypes, loadingTestMethods, fetchingTestMethods, loadingStorageLocations, fetchingStorageLocations, loadingCustomers, fetchingCustomers]);

	const modalLoading = creatingDepartment || updatingDepartment || creatingLaboratory || updatingLaboratory ||
		creatingSpecimenType || updatingSpecimenType || creatingTestMethod || updatingTestMethod ||
		creatingStorageLocation || updatingStorageLocation || creatingCustomer || updatingCustomer;

	// Map category to import type (only customers and testMethods support import)
	const importTypeMap: Record<string, ImportType | null> = {
		customers: "customers",
		testMethods: "test-methods",
		departments: null,
		laboratories: null,
		specimenTypes: null,
		storageLocations: null,
	};

	const canImport = importTypeMap[activeCategory] !== null;

	const currentData = data[activeCategory as keyof typeof data] || [];
	const filteredData = searchText
		? currentData.filter(
				(item: MasterDataItem) =>
					item.code
						?.toLowerCase()
						.includes(searchText.toLowerCase()) ||
					item.name?.toLowerCase().includes(searchText.toLowerCase())
		  )
		: currentData;

	const handleCreate = () => {
		setEditingItem(null);
		form.resetFields();
		form.setFieldsValue({
			isActive: true,
			sortOrder: currentData.length + 1,
		});
		setIsModalOpen(true);
	};

	const handleEdit = (record: MasterDataItem) => {
		setEditingItem(record);
		form.setFieldsValue(record);
		setIsModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		try {
			switch (activeCategory) {
				case "departments":
					await deleteDepartment(id).unwrap();
					break;
				case "laboratories":
					await deleteLaboratory(id).unwrap();
					break;
				case "specimenTypes":
					await deleteSpecimenType(id).unwrap();
					break;
				case "testMethods":
					await deleteTestMethod(id).unwrap();
					break;
				case "storageLocations":
					await deleteStorageLocation(id).unwrap();
					break;
				case "customers":
					await deleteCustomer(id).unwrap();
					break;
			}

			message.success("Xóa thành công!");
		} catch (err: any) {
			console.error("Failed to delete:", err);
			const errorMsg = err?.data?.error?.message || err?.data?.message || "Lỗi khi xóa dữ liệu";
			message.error(errorMsg);
		}
	};

	const handleModalOk = async () => {
		try {
			const values = await form.validateFields();

			if (editingItem) {
				// Update existing item
				switch (activeCategory) {
					case "departments":
						await updateDepartment({
							id: editingItem.id,
							data: values as CreateUpdateDepartmentDto,
						}).unwrap();
						break;
					case "laboratories":
						await updateLaboratory({
							id: editingItem.id,
							data: values as CreateUpdateLaboratoryDto,
						}).unwrap();
						break;
					case "specimenTypes":
						await updateSpecimenType({
							id: editingItem.id,
							data: values as CreateUpdateSpecimenTypeDto,
						}).unwrap();
						break;
					case "testMethods":
						await updateTestMethod({
							id: editingItem.id,
							data: values as CreateUpdateTestMethodDto,
						}).unwrap();
						break;
					case "storageLocations":
						await updateStorageLocation({
							id: editingItem.id,
							data: values as CreateUpdateStorageLocationDto,
						}).unwrap();
						break;
					case "customers":
						await updateCustomer({
							id: editingItem.id,
							data: values as CreateUpdateCustomerDto,
						}).unwrap();
						break;
				}
				message.success("Cập nhật thành công!");
			} else {
				// Create new item
				switch (activeCategory) {
					case "departments":
						await createDepartment(values as CreateUpdateDepartmentDto).unwrap();
						break;
					case "laboratories":
						await createLaboratory(values as CreateUpdateLaboratoryDto).unwrap();
						break;
					case "specimenTypes":
						await createSpecimenType(values as CreateUpdateSpecimenTypeDto).unwrap();
						break;
					case "testMethods":
						await createTestMethod(values as CreateUpdateTestMethodDto).unwrap();
						break;
					case "storageLocations":
						await createStorageLocation(values as CreateUpdateStorageLocationDto).unwrap();
						break;
					case "customers":
						await createCustomer(values as CreateUpdateCustomerDto).unwrap();
						break;
				}
				message.success("Thêm mới thành công!");
			}

			setIsModalOpen(false);
			form.resetFields();
		} catch (err: any) {
			console.error("Failed to save:", err);
			const errorMsg = err?.data?.error?.message || err?.data?.message || "Lỗi khi lưu dữ liệu";
			message.error(errorMsg);
		}
	};

	const handleImportExcel = () => {
		if (canImport) {
			setImportModalOpen(true);
		} else {
			message.info(
				`Import Excel chưa hỗ trợ cho ${categoryLabels[activeCategory]}`
			);
		}
	};

	const handleDownloadTemplate = async () => {
		if (!canImport) {
			message.info(
				`Download template chưa hỗ trợ cho ${categoryLabels[activeCategory]}`
			);
			return;
		}

		setDownloadingTemplate(true);
		try {
			let blob: Blob;
			let filename: string;

			if (activeCategory === "customers") {
				blob = await importService.downloadCustomersTemplate();
				filename = "customers-template.xlsx";
			} else if (activeCategory === "testMethods") {
				blob = await importService.downloadTestMethodsTemplate();
				filename = "test-methods-template.xlsx";
			} else {
				throw new Error("Unsupported category for template download");
			}

			downloadBlobAsFile(blob, filename);
			message.success("Tải template thành công!");
		} catch (error) {
			console.error("Error downloading template:", error);
			message.error("Không thể tải template. Vui lòng thử lại.");
		} finally {
			setDownloadingTemplate(false);
		}
	};

	const handleExportExcel = () => {
		const blob = new Blob(["Mock Excel Data"], {
			type: "application/vnd.ms-excel",
		});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `master_data_${activeCategory}.xlsx`;
		a.click();
		message.success("Xuất Excel thành công!");
	};

	// Dynamic columns based on category
	const getColumns = (): ColumnsType<MasterDataItem> => {
		const baseColumns: ColumnsType<MasterDataItem> = [
			{
				title: "STT",
				dataIndex: "sortOrder",
				key: "sortOrder",
				width: 60,
				render: (_, __, index) => index + 1,
			},
			{
				title: "Mã",
				dataIndex: "code",
				key: "code",
				width: 120,
			},
			{
				title: "Tên",
				dataIndex: "name",
				key: "name",
				width: 250,
			},
		];

		// Add extra columns for specific categories
		if (activeCategory === "customers") {
			baseColumns.push(
				{
					title: "Địa chỉ",
					dataIndex: "address",
					key: "address",
					ellipsis: true,
				},
				{
					title: "Điện thoại",
					dataIndex: "phone",
					key: "phone",
					width: 130,
				},
				{
					title: "Email",
					dataIndex: "email",
					key: "email",
					width: 180,
					ellipsis: true,
				}
			);
		} else if (activeCategory === "storageLocations") {
			baseColumns.push(
				{
					title: "Mô tả",
					dataIndex: "description",
					key: "description",
					ellipsis: true,
				},
				{
					title: "Nhiệt độ",
					dataIndex: "temperature",
					key: "temperature",
					width: 100,
				}
			);
		} else if (activeCategory === "testMethods") {
			baseColumns.push(
				{
					title: "Mô tả",
					dataIndex: "description",
					key: "description",
					ellipsis: true,
				},
				{
					title: "Tiêu chuẩn",
					dataIndex: "standard",
					key: "standard",
					width: 150,
				}
			);
		} else if (activeCategory === "laboratories") {
			baseColumns.push({
				title: "Quản lý kỹ thuật",
				dataIndex: "technicalManagerName",
				key: "technicalManagerName",
				width: 180,
				render: (technicalManagerName: string, record: any) => {
					// If technicalManagerName is available, use it
					if (technicalManagerName) {
						return technicalManagerName;
					}
					// Otherwise, try to find from users list
					if (record.technicalManagerId) {
						const user = users.find((u) => u.id === record.technicalManagerId);
						return user?.displayName || "-";
					}
					return "-";
				},
			});
		} else {
			baseColumns.push({
				title: "Mô tả",
				dataIndex: "description",
				key: "description",
				ellipsis: true,
			});
		}

		baseColumns.push(
			{
				title: "Trạng thái",
				dataIndex: "isActive",
				key: "isActive",
				width: 100,
				render: (isActive: boolean) => (
					<Tag color={isActive ? "green" : "red"}>
						{isActive ? "Hoạt động" : "Ngừng"}
					</Tag>
				),
			},
			{
				title: "Thao tác",
				key: "actions",
				width: 100,
				render: (_, record) => (
					<Space size="small">
						<Button
							type="link"
							size="small"
							icon={<EditOutlined />}
							onClick={() => handleEdit(record)}
						/>
						<Popconfirm
							title="Bạn có chắc chắn muốn xóa?"
							onConfirm={() => handleDelete(record.id)}
							okText="Có"
							cancelText="Không"
						>
							<Button
								type="link"
								size="small"
								danger
								icon={<DeleteOutlined />}
							/>
						</Popconfirm>
					</Space>
				),
			}
		);

		return baseColumns;
	};

	// Calculate stats
	const totalItems = Object.values(data).reduce(
		(sum, arr) => sum + arr.length,
		0
	);

	return (
		<div>
			{/* Stats Cards */}
			<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
				<Col xs={12} sm={8} md={6}>
					<Card>
						<Statistic
							title="Tổng danh mục"
							value={Object.keys(data).length}
							prefix={<DatabaseOutlined />}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={8} md={6}>
					<Card>
						<Statistic title="Tổng dữ liệu" value={totalItems} />
					</Card>
				</Col>
				{Object.entries(categoryLabels)
					.slice(0, 3)
					.map(([key, label]) => (
						<Col xs={12} sm={8} md={4} key={key}>
							<Card>
								<Statistic
									title={label}
									value={(data[key as keyof typeof data] as MasterDataItem[])?.length || 0}
								/>
							</Card>
						</Col>
					))}
			</Row>

			<Card
				title={
					<Space>
						<DatabaseOutlined />
						Ngân hàng dữ liệu (Master Data)
					</Space>
				}
				extra={
					activeCategory !== "indicators" && activeCategory !== "formTemplates" && (
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
							<Button
								icon={<ImportOutlined />}
								onClick={handleImportExcel}
							>
								Import Excel
							</Button>
							<Button
								icon={<ExportOutlined />}
								onClick={handleExportExcel}
							>
								Export Excel
							</Button>
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={handleCreate}
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
					}}
					tabPosition="left"
					style={{ minHeight: 400 }}
					items={Object.entries(categoryLabels).map(
						([key, label]) => ({
							key,
							label: (
								<Space>
									{label}
									{key !== "indicators" && key !== "formTemplates" && (
										<Tag>{(data[key as keyof typeof data] as MasterDataItem[])?.length || 0}</Tag>
									)}
								</Space>
							),
							children:
								key === "indicators" ? (
									<IndicatorsTab onDataChange={() => {}} />
								) : key === "formTemplates" ? (
									<FormTemplatesTab />
								) : (
									<>
										<Row
											gutter={[16, 16]}
											style={{ marginBottom: 16 }}
										>
											<Col xs={24} sm={12} md={8}>
												<Input
													placeholder="Tìm kiếm theo mã, tên..."
													prefix={<SearchOutlined />}
													value={searchText}
													onChange={(e) =>
														setSearchText(
															e.target.value
														)
													}
													allowClear
												/>
											</Col>
										</Row>

										<Spin
											spinning={loading[key as keyof typeof loading] || false}
											tip="Loading data..."
										>
											<Table
												columns={getColumns()}
												dataSource={filteredData as MasterDataItem[]}
												rowKey="id"
												pagination={
													activeCategory === "laboratories"
														? false
														: {
																pageSize: 50,
																pageSizeOptions: [
																	50, 100, 150,
																],
																showSizeChanger: true,
																showTotal: (total) =>
																	`Tổng ${total} mục`,
														  }
												}
												scroll={{
													x:
														activeCategory ===
														"customers"
															? 900
															: 700,
												}}
											/>
										</Spin>
									</>
								),
						})
					)}
				/>
			</Card>

			{/* Create/Edit Modal */}
			<Modal
				title={
					editingItem
						? `Chỉnh sửa ${categoryLabels[activeCategory]}`
						: `Thêm ${categoryLabels[activeCategory]} mới`
				}
				open={isModalOpen}
				onOk={handleModalOk}
				onCancel={() => {
					setIsModalOpen(false);
					form.resetFields();
				}}
				width={600}
				okText={editingItem ? "Cập nhật" : "Thêm mới"}
				cancelText="Hủy"
				centered
				confirmLoading={modalLoading}
			>
				<Form form={form} layout="vertical">
					{activeCategory !== "customers" && (
						<Row gutter={16}>
							<Col span={8}>
								<Form.Item
									name="code"
									label="Mã"
									rules={[
										{
											required: true,
											message: "Vui lòng nhập mã",
										},
									]}
								>
									<Input />
								</Form.Item>
							</Col>
							<Col span={16}>
								<Form.Item
									name="name"
									label="Tên"
									rules={[
										{
											required: true,
											message: "Vui lòng nhập tên",
										},
									]}
								>
									<Input />
								</Form.Item>
							</Col>
						</Row>
					)}
					{activeCategory === "customers" && (
						<>
							<Form.Item
								name="name"
								label="Tên khách hàng"
								rules={[
									{
										required: true,
										message: "Vui lòng nhập tên khách hàng",
									},
								]}
							>
								<Input />
							</Form.Item>
							<Row gutter={16}>
								<Col span={12}>
									<Form.Item name="phone" label="Điện thoại">
										<Input />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="email"
										label="Email"
										rules={[
											{
												type: "email",
												message: "Email không hợp lệ",
											},
										]}
									>
										<Input />
									</Form.Item>
								</Col>
							</Row>
							<Form.Item name="address" label="Địa chỉ">
								<Input.TextArea rows={2} />
							</Form.Item>
							<Row gutter={16}>
								<Col span={12}>
									<Form.Item
										name="taxCode"
										label="Mã số thuế"
									>
										<Input />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="contactPerson"
										label="Người liên hệ"
									>
										<Input />
									</Form.Item>
								</Col>
							</Row>
						</>
					)}
					{activeCategory !== "customers" && activeCategory !== "laboratories" && (
						<>
							<Form.Item name="description" label="Mô tả">
								<Input.TextArea rows={3} />
							</Form.Item>
							{activeCategory === "storageLocations" && (
								<Row gutter={16}>
									<Col span={8}>
										<Form.Item
											name="temperature"
											label="Nhiệt độ"
										>
											<Input placeholder="VD: 2-8°C" />
										</Form.Item>
									</Col>
									<Col span={8}>
										<Form.Item
											name="humidity"
											label="Độ ẩm"
										>
											<Input placeholder="VD: 60-70%" />
										</Form.Item>
									</Col>
									<Col span={8}>
										<Form.Item
											name="capacity"
											label="Sức chứa"
										>
											<Input type="number" />
										</Form.Item>
									</Col>
								</Row>
							)}
							{activeCategory === "testMethods" && (
								<Form.Item name="standard" label="Tiêu chuẩn">
									<Input placeholder="VD: TCVN 6663-6:2008" />
								</Form.Item>
							)}
							<Row gutter={16}>
								<Col span={12}>
									<Form.Item
										name="sortOrder"
										label="Thứ tự sắp xếp"
									>
										<Input type="number" />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="isActive"
										label="Trạng thái"
									>
										<Select>
											<Select.Option value={true}>
												Hoạt động
											</Select.Option>
											<Select.Option value={false}>
												Ngừng
											</Select.Option>
										</Select>
									</Form.Item>
								</Col>
							</Row>
						</>
					)}
					{activeCategory === "laboratories" && (
						<>
							<Form.Item
								name="technicalManagerId"
								label="Quản lý kỹ thuật"
							>
								<Select
									showSearch
									allowClear
									placeholder="Chọn quản lý kỹ thuật"
									optionFilterProp="children"
									filterOption={(input, option) =>
										(option?.children as unknown as string)
											?.toLowerCase()
											.includes(input.toLowerCase())
									}
								>
									{users.map((user) => (
										<Select.Option key={user.id} value={user.id}>
											{user.displayName}
										</Select.Option>
									))}
								</Select>
							</Form.Item>
							<Form.Item
								name="isActive"
								label="Trạng thái"
							>
								<Select>
									<Select.Option value={true}>
										Hoạt động
									</Select.Option>
									<Select.Option value={false}>
										Ngừng
									</Select.Option>
								</Select>
							</Form.Item>
						</>
					)}
					{activeCategory === "customers" && (
						<Form.Item name="isActive" label="Trạng thái">
							<Select>
								<Select.Option value={true}>
									Hoạt động
								</Select.Option>
								<Select.Option value={false}>
									Ngừng
								</Select.Option>
							</Select>
						</Form.Item>
					)}
				</Form>
			</Modal>

			{/* Import Excel Modal */}
			{canImport && importTypeMap[activeCategory] && (
				<ImportExcelModal
					open={importModalOpen}
					onClose={() => setImportModalOpen(false)}
					onSuccess={() => {
						setImportModalOpen(false);
						// RTK Query will auto-refetch due to cache invalidation
					}}
					importType={importTypeMap[activeCategory]!}
					title={`Import ${categoryLabels[activeCategory]}`}
				/>
			)}
		</div>
	);
};

export default MasterDataList;
