import React, { useState, useEffect, useCallback } from "react";
import { Dayjs } from "dayjs";
import { message } from "antd";
import { authService } from "../../services/authService";
import { laboratoryService, LaboratoryDto } from "../../services/masterDataService";
import statisticsService, {
  LabReportDataDto,
  LabContractDetailDto,
  LabContractSummaryDto,
} from "../../services/statisticsService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { FilterPeriod, getDateRangeForPeriod } from "./LabReport/utils";
import LabReportView from "./LabReport/LabReportView";

const LabReportPage: React.FC = () => {
  const canExport = authService.hasPermission(PERMISSIONS.LabReport.Export);

  const [allLabs, setAllLabs] = useState<LaboratoryDto[]>([]);
  const [allowedLabs, setAllowedLabs] = useState<LaboratoryDto[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(getDateRangeForPeriod("month"));
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingDetail, setExportingDetail] = useState(false);
  const [reportData, setReportData] = useState<LabReportDataDto | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractDetail, setContractDetail] = useState<LabContractDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    laboratoryService.getActive().then((labs) => {
      setAllLabs(labs);
      const userInfo = authService.getUserInfo();
      const matchHoa = (name: string) =>
        name.toLowerCase().includes("hóa") || name.toLowerCase().includes("hoa");
      const labHoa = labs.find((l) => matchHoa(l.name));
      const defaultAllId = labHoa?.id ?? labs[0]?.id ?? "";

      // Admin hoặc Ban Giám Đốc → thấy tất cả labs
      const isAdmin = authService.isAdmin();
      const deptName = (userInfo?.departmentName ?? "").toLowerCase();
      const isDirector = deptName.includes("giám đốc") || deptName.includes("giam doc");

      if (isAdmin || isDirector) {
        setAllowedLabs(labs);
        setSelectedLabId(defaultAllId);
        return;
      }

      // Còn lại: match theo departmentId của lab
      const userDeptId = userInfo?.departmentId;
      const userLab = userDeptId ? labs.find((l) => l.departmentId === userDeptId) : null;

      if (userLab) {
        setAllowedLabs([userLab]);
        setSelectedLabId(userLab.id);
      } else {
        setAllowedLabs(labs);
        setSelectedLabId(defaultAllId);
      }
    }).catch(() => {
      message.error("Không thể tải danh sách lab");
    });
  }, []);

  const loadReportData = useCallback(async () => {
    if (!selectedLabId) return;
    setLoading(true);
    try {
      const data = await statisticsService.getLabReportData({
        labId: selectedLabId,
        fromDate: dateRange[0].format("YYYY-MM-DD"),
        toDate: dateRange[1].format("YYYY-MM-DD"),
      });
      setReportData(data);
      setSelectedContractId(null);
      setContractDetail(null);
    } catch {
      message.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  }, [selectedLabId, dateRange]);

  useEffect(() => {
    if (selectedLabId) loadReportData();
  }, [loadReportData]);

  const loadContractDetail = useCallback(
    async (testRequestId: string) => {
      if (!selectedLabId) return;
      setDetailLoading(true);
      try {
        const detail = await statisticsService.getLabContractDetail(testRequestId, selectedLabId);
        setContractDetail(detail);
      } catch {
        message.error("Không thể tải chi tiết hợp đồng");
      } finally {
        setDetailLoading(false);
      }
    },
    [selectedLabId]
  );

  const handleContractClick = useCallback(
    (record: LabContractSummaryDto) => {
      if (selectedContractId === record.testRequestId) {
        setSelectedContractId(null);
        setContractDetail(null);
      } else {
        setSelectedContractId(record.testRequestId);
        loadContractDetail(record.testRequestId);
      }
    },
    [selectedContractId, loadContractDetail]
  );

  const handlePeriodChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    setIsCustomDateRange(false);
    setDateRange(getDateRangeForPeriod(period));
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      setIsCustomDateRange(true);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  };

  const handleExport = useCallback(async () => {
    if (!selectedLabId) return;
    setExporting(true);
    try {
      const blob = await statisticsService.exportLabReport({
        labId: selectedLabId,
        fromDate: dateRange[0].format("YYYY-MM-DD"),
        toDate: dateRange[1].format("YYYY-MM-DD"),
      });
      downloadBlob(blob, `BaoCaoPhongLab_${dateRange[0].format("DDMMYYYY")}_${dateRange[1].format("DDMMYYYY")}.xlsx`);
      message.success("Xuất báo cáo thành công");
    } catch {
      message.error("Không thể xuất báo cáo");
    } finally {
      setExporting(false);
    }
  }, [selectedLabId, dateRange]);

  const handleExportDetail = useCallback(async () => {
    if (!selectedLabId) return;
    setExportingDetail(true);
    try {
      const blob = await statisticsService.exportLabReportDetail({
        labId: selectedLabId,
        fromDate: dateRange[0].format("YYYY-MM-DD"),
        toDate: dateRange[1].format("YYYY-MM-DD"),
      });
      downloadBlob(blob, `BaoCaoPhongLab_ChiTiet_${dateRange[0].format("DDMMYYYY")}_${dateRange[1].format("DDMMYYYY")}.xlsx`);
      message.success("Xuất báo cáo chi tiết thành công");
    } catch {
      message.error("Không thể xuất báo cáo chi tiết");
    } finally {
      setExportingDetail(false);
    }
  }, [selectedLabId, dateRange]);

  return (
    <LabReportView
      allowedLabs={allowedLabs}
      selectedLabId={selectedLabId}
      selectedLab={allLabs.find((l) => l.id === selectedLabId)}
      filterPeriod={filterPeriod}
      dateRange={dateRange}
      isCustomDateRange={isCustomDateRange}
      loading={loading}
      exporting={exporting}
      exportingDetail={exportingDetail}
      canExport={canExport}
      reportData={reportData}
      selectedContractId={selectedContractId}
      contractDetail={contractDetail}
      detailLoading={detailLoading}
      onLabChange={setSelectedLabId}
      onPeriodChange={handlePeriodChange}
      onRangeChange={handleRangeChange}
      onReload={loadReportData}
      onExport={handleExport}
      onExportDetail={handleExportDetail}
      onContractClick={handleContractClick}
    />
  );
};

export default LabReportPage;
