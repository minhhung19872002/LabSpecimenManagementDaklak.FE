// @ts-nocheck
import React, { useState, useEffect } from "react";
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
	Alert,
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
	departmentService,
	specimenTypeService,
	testMethodService,
	storageLocationService,
	customerService,
	DepartmentDto,
	SpecimenTypeDto,
	TestMethodDto,
	StorageLocationDto,
	CustomerDto,
	CreateUpdateDepartmentDto,
	CreateUpdateSpecimenTypeDto,
	CreateUpdateTestMethodDto,
	CreateUpdateStorageLocationDto,
	CreateUpdateCustomerDto,
} from "../../services/masterDataService";
import ImportExcelModal, {
	ImportType,
} from "../../components/common/ImportExcelModal";
import {
	importService,
	downloadBlobAsFile,
} from "../../services/importService";
import IndicatorsTab from "./IndicatorsTab";

// Unified type for all master data items
type MasterDataItem =
	| DepartmentDto
	| SpecimenTypeDto
	| TestMethodDto
	| StorageLocationDto
	| CustomerDto;

const categoryLabels: Record<string, string> = {
	departments: "Phòng ban",
	specimenTypes: "Loại mẫu",
	testMethods: "Phương pháp thử",
	storageLocations: "Vị trí lưu kho",
	customers: "Khách hàng",
	indicators: "Nhóm chỉ tiêu",
};

const MasterDataList: React.FC = () => {
	const [activeCategory, setActiveCategory] = useState("departments");
	const [data, setData] = useState<Record<string, MasterDataItem[]>>({
		departments: [],
		specimenTypes: [],
		testMethods: [],
		storageLocations: [],
		customers: [],
		indicators: [],
	});
	const [loading, setLoading] = useState<Record<string, boolean>>({
		departments: false,
		specimenTypes: false,
		testMethods: false,
		storageLocations: false,
		customers: false,
		indicators: false,
	});
	const [error, setError] = useState<string | null>(null);
	const [searchText, setSearchText] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
	const [modalLoading, setModalLoading] = useState(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [downloadingTemplate, setDownloadingTemplate] = useState(false);
	const [form] = Form.useForm();

	// Map category to import type (only customers and testMethods support import)
	const importTypeMap: Record<string, ImportType | null> = {
		customers: "customers",
		testMethods: "test-methods",
		departments: null,
		specimenTypes: null,
		storageLocations: null,
	};

	const canImport = importTypeMap[activeCategory] !== null;

	// Fetch data for a specific category
	const fetchCategoryData = async (category: string) => {
		try {
			setLoading((prev) => ({ ...prev, [category]: true }));
			setError(null);

			let result;
			switch (category) {
				case "departments":
					result = await departmentService.getList({
						maxResultCount: 1000,
					});
					break;
				case "specimenTypes":
					result = await specimenTypeService.getList({
						maxResultCount: 1000,
					});
					break;
				case "testMethods":
					result = await testMethodService.getList({
						maxResultCount: 1000,
					});
					break;
				case "storageLocations":
					result = await storageLocationService.getList({
						maxResultCount: 1000,
					});
					break;
				case "customers":
					result = await customerService.getList({
						maxResultCount: 1000,
					});
					break;
				default:
					result = { items: [], totalCount: 0 };
			}

			setData((prev) => ({ ...prev, [category]: result.items }));
		} catch (err: any) {
			console.error(`Failed to fetch ${category}:`, err);
			const errorMsg =
				err?.response?.data?.error?.message ||
				err?.message ||
				`Failed to load ${category}`;
			setError(errorMsg);
			message.error(errorMsg);
		} finally {
			setLoading((prev) => ({ ...prev, [category]: false }));
		}
	};

	// Load all categories on mount to get correct counts for stats
	useEffect(() => {
		const loadAllCategories = async () => {
			const categories = Object.keys(categoryLabels);
			await Promise.all(
				categories.map((category) => fetchCategoryData(category))
			);
		};
		loadAllCategories();
	}, []);

	// Reload current category data when switching tabs (if needed for refresh)
	useEffect(() => {
		// Only reload if data is empty (not loaded yet)
		if (data[activeCategory]?.length === 0 && !loading[activeCategory]) {
			fetchCategoryData(activeCategory);
		}
	}, [activeCategory]);

	const currentData = data[activeCategory] || [];
	const filteredData = searchText
		? currentData.filter(
				(item) =>
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
			setError(null);

			switch (activeCategory) {
				case "departments":
					await departmentService.delete(id);
					break;
				case "specimenTypes":
					await specimenTypeService.delete(id);
					break;
				case "testMethods":
					await testMethodService.delete(id);
					break;
				case "storageLocations":
					await storageLocationService.delete(id);
					break;
				case "customers":
					await customerService.delete(id);
					break;
			}

			message.success("Xóa thành công!");
			// Refresh data
			await fetchCategoryData(activeCategory);
		} catch (err: any) {
			console.error("Failed to delete:", err);
			const errorMsg =
				err?.response?.data?.error?.message ||
				err?.message ||
				"Failed to delete item";
			setError(errorMsg);
			message.error(errorMsg);
		}
	};

	const handleModalOk = async () => {
		try {
			setModalLoading(true);
			setError(null);
			const values = await form.validateFields();

			if (editingItem) {
				// Update existing item
				switch (activeCategory) {
					case "departments":
						await departmentService.update(
							editingItem.id,
							values as CreateUpdateDepartmentDto
						);
						break;
					case "specimenTypes":
						await specimenTypeService.update(
							editingItem.id,
							values as CreateUpdateSpecimenTypeDto
						);
						break;
					case "testMethods":
						await testMethodService.update(
							editingItem.id,
							values as CreateUpdateTestMethodDto
						);
						break;
					case "storageLocations":
						await storageLocationService.update(
							editingItem.id,
							values as CreateUpdateStorageLocationDto
						);
						break;
					case "customers":
						await customerService.update(
							editingItem.id,
							values as CreateUpdateCustomerDto
						);
						break;
				}
				message.success("Cập nhật thành công!");
			} else {
				// Create new item
				switch (activeCategory) {
					case "departments":
						await departmentService.create(
							values as CreateUpdateDepartmentDto
						);
						break;
					case "specimenTypes":
						await specimenTypeService.create(
							values as CreateUpdateSpecimenTypeDto
						);
						break;
					case "testMethods":
						await testMethodService.create(
							values as CreateUpdateTestMethodDto
						);
						break;
					case "storageLocations":
						await storageLocationService.create(
							values as CreateUpdateStorageLocationDto
						);
						break;
					case "customers":
						await customerService.create(
							values as CreateUpdateCustomerDto
						);
						break;
				}
				message.success("Thêm mới thành công!");
			}

			setIsModalOpen(false);
			form.resetFields();
			// Refresh data
			await fetchCategoryData(activeCategory);
		} catch (err: any) {
			console.error("Failed to save:", err);
			const errorMsg =
				err?.response?.data?.error?.message ||
				err?.message ||
				"Failed to save item";
			setError(errorMsg);
			message.error(errorMsg);
		} finally {
			setModalLoading(false);
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
									value={data[key]?.length || 0}
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
					activeCategory !== "indicators" && (
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
									{key !== "indicators" && (
										<Tag>{data[key]?.length || 0}</Tag>
									)}
								</Space>
							),
							children:
								key === "indicators" ? (
									<IndicatorsTab onDataChange={() => {}} />
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
											spinning={loading[key]}
											tip="Loading data..."
										>
											<Table
												columns={getColumns()}
												dataSource={filteredData}
												rowKey="id"
												pagination={{
													pageSize: 50,
													pageSizeOptions: [
														50, 100, 150,
													],
													showSizeChanger: true,
													showTotal: (total) =>
														`Tổng ${total} mục`,
												}}
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
					{activeCategory !== "customers" && (
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
						fetchCategoryData(activeCategory);
					}}
					importType={importTypeMap[activeCategory]!}
					title={`Import ${categoryLabels[activeCategory]}`}
				/>
			)}
		</div>
	);
};

export default MasterDataList;
