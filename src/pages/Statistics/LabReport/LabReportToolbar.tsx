import React from "react";
import { Select, Radio, DatePicker, Button, Dropdown } from "antd";
import { DownloadOutlined, ExperimentOutlined, ReloadOutlined } from "../../../components/common/Icon";
import { DownOutlined, LoadingOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { LaboratoryDto } from "../../../services/masterDataService";
import { LabReportDataDto } from "../../../services/statisticsService";
import { FilterPeriod } from "./utils";
import "../../Dashboard/Dashboard.css";

const { RangePicker } = DatePicker;

export interface LabReportToolbarProps {
  allowedLabs: LaboratoryDto[];
  selectedLabId: string;
  selectedLab: LaboratoryDto | undefined;
  filterPeriod: FilterPeriod;
  dateRange: [Dayjs, Dayjs];
  isCustomDateRange: boolean;
  loading: boolean;
  exporting: boolean;
  exportingDetail: boolean;
  canExport: boolean;
  reportData: LabReportDataDto | null;
  onLabChange: (id: string) => void;
  onPeriodChange: (period: FilterPeriod) => void;
  onRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onReload: () => void;
  onExport: () => void;
  onExportDetail: () => void;
}

const LabReportToolbar: React.FC<LabReportToolbarProps> = ({
  allowedLabs,
  selectedLabId,
  selectedLab,
  filterPeriod,
  dateRange,
  isCustomDateRange,
  loading,
  exporting,
  exportingDetail,
  canExport,
  reportData,
  onLabChange,
  onPeriodChange,
  onRangeChange,
  onReload,
  onExport,
  onExportDetail,
}) => {
  const isBusy = exporting || exportingDetail;

  return (
    <div className="statistics-filter-bar">
      <h2 className="statistics-title">
        <ExperimentOutlined /> Báo cáo phòng Lab
        {selectedLab && (
          <span style={{ fontSize: 16, fontWeight: 400, color: "#595959", marginLeft: 12 }}>
            — {selectedLab.name}
          </span>
        )}
      </h2>
      <div className="statistics-filter-controls">
        <Select
          value={selectedLabId}
          onChange={onLabChange}
          options={allowedLabs.map((l) => ({ value: l.id, label: l.name }))}
          style={{ minWidth: 160 }}
          placeholder="Chọn lab"
          disabled={allowedLabs.length <= 1}
        />
        <div className="statistics-period-tabs">
          <Radio.Group
            value={isCustomDateRange ? undefined : filterPeriod}
            onChange={(e) => onPeriodChange(e.target.value as FilterPeriod)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="month">Tháng</Radio.Button>
            <Radio.Button value="quarter">Quý</Radio.Button>
            <Radio.Button value="half_year">Nửa năm</Radio.Button>
            <Radio.Button value="year">Năm</Radio.Button>
          </Radio.Group>
        </div>
        <RangePicker
          value={dateRange}
          onChange={(dates) => onRangeChange(dates as [Dayjs | null, Dayjs | null] | null)}
          format="DD/MM/YYYY"
          allowClear={false}
          style={{ width: 240 }}
        />
        <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading} />
        {canExport && (
          <Dropdown
            trigger={["click"]}
            disabled={!reportData || isBusy}
            menu={{
              items: [
                {
                  key: "overview",
                  label: "Báo cáo tổng quan",
                  icon: <DownloadOutlined />,
                  onClick: onExport,
                },
                {
                  key: "detail",
                  label: "Báo cáo chi tiết",
                  icon: <DownloadOutlined />,
                  onClick: onExportDetail,
                },
              ],
            }}
          >
            <Button
              type="primary"
              icon={isBusy ? <LoadingOutlined /> : <DownloadOutlined />}
              style={{ opacity: !reportData ? 0.6 : 1 }}
            >
              Xuất Excel <DownOutlined style={{ fontSize: 11, marginLeft: 4 }} />
            </Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default LabReportToolbar;
