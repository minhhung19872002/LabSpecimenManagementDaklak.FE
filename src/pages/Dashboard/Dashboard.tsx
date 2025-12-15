/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
	Card,
	Row,
	Col,
	Statistic,
	Table,
	Tag,
	Progress,
	List,
	Avatar,
	Timeline,
	Alert,
	Spin,
} from "antd";
import {
	FileTextOutlined,
	ExperimentOutlined,
	CheckCircleOutlined,
	WarningOutlined,
	ClockCircleOutlined,
	UserOutlined,
	RiseOutlined,
	SyncOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dashboardService, {
	DashboardSummaryDto,
	RecentActivityDto,
} from "../../services/dashboardService";
import dayjs from "dayjs";

interface RecentRequest {
	id: string;
	requestNumber: string;
	customerName: string;
	status: string;
	date: string;
}

const getStatusConfig = (status: string | number) => {
	const configs: Record<string | number, { color: string; text: string }> = {
		// Numeric status values (from API)
		0: { color: "default", text: "Chờ xử lý" },
		1: { color: "processing", text: "Đang thực hiện" },
		2: { color: "success", text: "Hoàn thành" },
		3: { color: "error", text: "Đã hủy" },
		// String status values (legacy)
		Pending: { color: "default", text: "Chờ xử lý" },
		InProgress: { color: "processing", text: "Đang thực hiện" },
		Completed: { color: "success", text: "Hoàn thành" },
		Cancelled: { color: "error", text: "Đã hủy" },
		PendingReview: { color: "orange", text: "Chờ duyệt B1" },
		PendingApproval: { color: "purple", text: "Chờ duyệt B2" },
	};
	return configs[status] || { color: "default", text: String(status) };
};

const Dashboard: React.FC = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
	const [recentActivities, setRecentActivities] = useState<
		RecentActivityDto[]
	>([]);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				setError(null);

				// Fetch summary data
				const summaryData = await dashboardService.getSummary();
				setSummary(summaryData);

				// Fetch recent activities
				const activitiesData =
					await dashboardService.getRecentActivities(5);
				setRecentActivities(activitiesData);
			} catch (err: any) {
				console.error("Failed to fetch dashboard data:", err);
				setError(
					err?.response?.data?.error?.message ||
						err?.message ||
						"Failed to load dashboard data"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	// Recent requests from dashboard API
	const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
	const [pendingApprovals, setPendingApprovals] = useState<
		{ id: string; testCode: string; parameter: string; status: string }[]
	>([]);

	// Load additional dashboard data
	useEffect(() => {
		const loadExtraData = async () => {
			try {
				// Try to get recent requests
				const requestsData = await dashboardService.getRecentRequests?.(
					5
				);
				if (requestsData) {
					setRecentRequests(
						requestsData.map((r: any) => ({
							id: r.id,
							requestNumber: r.requestNumber,
							customerName: r.customerName,
							status: r.status,
							date: dayjs(r.requestDate).format("YYYY-MM-DD"),
						}))
					);
				}
			} catch {
				console.log(
					"Could not load recent requests - API may not be available"
				);
			}

			try {
				// Try to get pending approvals
				const approvalsData =
					await dashboardService.getPendingApprovals?.(5);
				if (approvalsData) {
					setPendingApprovals(
						approvalsData.map((a: any) => ({
							id: a.id,
							testCode: a.testCode,
							parameter: a.parameter,
							status:
								a.approvalStatus === 1
									? "PendingReview"
									: "PendingApproval",
						}))
					);
				}
			} catch {
				console.log(
					"Could not load pending approvals - API may not be available"
				);
			}
		};

		if (summary) {
			loadExtraData();
		}
	}, [summary]);

	const requestColumns = [
		{
			title: "Mã yêu cầu",
			dataIndex: "requestNumber",
			key: "requestNumber",
		},
		{ title: "Khách hàng", dataIndex: "customerName", key: "customerName" },
		{
			title: "Trạng thái",
			dataIndex: "status",
			key: "status",
			render: (status: string | number) => {
				const config = getStatusConfig(status);
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{ title: "Ngày", dataIndex: "date", key: "date" },
	];

	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "400px",
				}}
			>
				<Spin size="large" tip="Loading dashboard data..." />
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<h2 style={{ marginBottom: 24 }}>{t("menu.dashboard")}</h2>
				<Alert
					message="Error Loading Dashboard"
					description={error}
					type="error"
					showIcon
				/>
			</div>
		);
	}

	if (!summary) {
		return (
			<div>
				<h2 style={{ marginBottom: 24 }}>{t("menu.dashboard")}</h2>
				<Alert
					message="No Data"
					description="No dashboard data available"
					type="info"
					showIcon
				/>
			</div>
		);
	}

	return (
		<div>
			<h2 style={{ marginBottom: 24 }}>{t("menu.dashboard")}</h2>

			{/* Statistics Cards */}
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} lg={6}>
					<Card hoverable>
						<Statistic
							title={t("statistics.totalRequests")}
							value={summary.totalTestRequests}
							prefix={
								<FileTextOutlined
									style={{ color: "#1890ff" }}
								/>
							}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card hoverable>
						<Statistic
							title={t("statistics.totalSpecimens")}
							value={summary.totalSpecimens}
							prefix={
								<ExperimentOutlined
									style={{ color: "#722ed1" }}
								/>
							}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card hoverable>
						<Statistic
							title={t("statistics.totalTests")}
							value={summary.totalTests}
							prefix={
								<CheckCircleOutlined
									style={{ color: "#52c41a" }}
								/>
							}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card hoverable>
						<Statistic
							title="Báo cáo NCR"
							value={summary.openNCRs}
							prefix={
								<WarningOutlined style={{ color: "#cf1322" }} />
							}
							styles={{ content: { color: "#cf1322" } }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Secondary Stats */}
			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} sm={12} lg={6}>
					<Card size="small">
						<Statistic
							title="Chờ xử lý"
							value={summary.pendingTestRequests}
							prefix={
								<ClockCircleOutlined
									style={{ color: "#faad14" }}
								/>
							}
							styles={{ content: { color: "#faad14" } }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card size="small">
						<Statistic
							title="Đang thử nghiệm"
							value={summary.specimenInTesting}
							prefix={
								<SyncOutlined
									spin
									style={{ color: "#1890ff" }}
								/>
							}
							styles={{ content: { color: "#1890ff" } }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card size="small">
						<Statistic
							title="Hoàn thành"
							value={summary.completedTests}
							prefix={
								<CheckCircleOutlined
									style={{ color: "#52c41a" }}
								/>
							}
							styles={{ content: { color: "#52c41a" } }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card size="small">
						<Statistic
							title="Chờ phê duyệt"
							value={summary.pendingApprovalResults}
							prefix={
								<RiseOutlined style={{ color: "#13c2c2" }} />
							}
							styles={{ content: { color: "#13c2c2" } }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Main Content */}
			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				{/* Recent Requests */}
				<Col xs={24} lg={14}>
					<Card
						title="Yêu cầu gần đây"
						extra={<a href="/requests">Xem tất cả</a>}
					>
						<Table
							dataSource={recentRequests}
							columns={requestColumns}
							rowKey="id"
							pagination={false}
							size="small"
						/>
					</Card>
				</Col>

				{/* Pending Approvals */}
				<Col xs={24} lg={10}>
					<Card
						title="Chờ phê duyệt"
						extra={
							<Tag color="orange">{pendingApprovals.length}</Tag>
						}
					>
						<List
							itemLayout="horizontal"
							dataSource={pendingApprovals}
							renderItem={(item) => (
								<List.Item>
									<List.Item.Meta
										avatar={
											<Avatar
												icon={<ExperimentOutlined />}
												style={{
													backgroundColor: "#1890ff",
												}}
											/>
										}
										title={
											<a href={`/test/${item.id}`}>
												{item.testCode}
											</a>
										}
										description={item.parameter}
									/>
									<Tag
										color={
											getStatusConfig(item.status).color
										}
									>
										{getStatusConfig(item.status).text}
									</Tag>
								</List.Item>
							)}
						/>
					</Card>
				</Col>
			</Row>

			{/* Bottom Row */}
			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				{/* Progress Overview */}
				<Col xs={24} lg={12}>
					<Card title="Tiến độ công việc">
						<div style={{ marginBottom: 16 }}>
							<div style={{ marginBottom: 4 }}>
								Yêu cầu hoàn thành
							</div>
							<Progress
								percent={
									summary.totalTestRequests > 0
										? Math.round(
												(summary.completedTests /
													summary.totalTestRequests) *
													100
										  )
										: 0
								}
								status="active"
								strokeColor="#52c41a"
							/>
						</div>
						<div style={{ marginBottom: 16 }}>
							<div style={{ marginBottom: 4 }}>
								Thử nghiệm đang thực hiện
							</div>
							<Progress
								percent={
									summary.totalTests > 0
										? Math.round(
												(summary.specimenInTesting /
													summary.totalTests) *
													100
										  )
										: 0
								}
								status="active"
								strokeColor="#1890ff"
							/>
						</div>
						<div style={{ marginBottom: 16 }}>
							<div style={{ marginBottom: 4 }}>
								Kết quả đã phê duyệt
							</div>
							<Progress
								percent={
									summary.totalTestResults > 0
										? Math.round(
												((summary.totalTestResults -
													summary.pendingApprovalResults) /
													summary.totalTestResults) *
													100
										  )
										: 0
								}
								status="active"
								strokeColor="#722ed1"
							/>
						</div>
						<div>
							<div style={{ marginBottom: 4 }}>
								Báo cáo NCR ({summary.openNCRs})
							</div>
							<Progress
								percent={
									summary.totalTests > 0
										? Math.min(
												Math.round(
													(summary.openNCRs /
														summary.totalTests) *
														100
												),
												100
										  )
										: 0
								}
								status={
									summary.openNCRs > 0
										? "exception"
										: "normal"
								}
								strokeColor="#cf1322"
								format={(percent) => (
									<span style={{ color: "#cf1322" }}>
										{percent}%
									</span>
								)}
							/>
						</div>
					</Card>
				</Col>

				{/* Recent Activities */}
				<Col xs={24} lg={12}>
					<Card title="Hoạt động gần đây">
						{recentActivities.length > 0 ? (
							<Timeline
								items={recentActivities.map((activity) => ({
									color: "blue",
									children: (
										<div>
											<span style={{ fontWeight: 500 }}>
												{dayjs(
													activity.performedAt
												).format("HH:mm")}
											</span>{" "}
											- {activity.description}
											<br />
											<span style={{ color: "#666" }}>
												<UserOutlined />{" "}
												{activity.performedByName ||
													"System"}{" "}
												| {activity.entityCode}
											</span>
										</div>
									),
								}))}
							/>
						) : (
							<div
								style={{
									textAlign: "center",
									color: "#999",
									padding: "20px",
								}}
							>
								Không có hoạt động gần đây
							</div>
						)}
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default Dashboard;
