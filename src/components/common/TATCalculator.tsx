import React, { useState, useEffect } from 'react';
import { DatePicker, InputNumber, Space, Tag, Typography, Tooltip } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;

interface TATCalculatorProps {
  startDate?: Dayjs | null;
  tatDays?: number;
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  holidays?: string[]; // Array of holiday dates in 'YYYY-MM-DD' format
  onEndDateChange?: (endDate: Dayjs | null, tatInfo: TATInfo) => void;
  mode?: 'auto' | 'manual'; // auto: calculate from startDate + tatDays, manual: user picks both dates
  showRemainingDays?: boolean;
}

interface TATInfo {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
  remainingDays: number;
  isOverdue: boolean;
  status: 'on-track' | 'warning' | 'overdue';
}

// Default Vietnam holidays 2025
const defaultHolidays2025 = [
  '2025-01-01', // New Year
  '2025-01-27', // Tet
  '2025-01-28',
  '2025-01-29',
  '2025-01-30',
  '2025-01-31',
  '2025-02-01',
  '2025-02-02',
  '2025-04-30', // Liberation Day
  '2025-05-01', // Labor Day
  '2025-09-02', // National Day
  '2025-09-03',
];

const TATCalculator: React.FC<TATCalculatorProps> = ({
  startDate = null,
  tatDays = 5,
  excludeWeekends = true,
  excludeHolidays = true,
  holidays = defaultHolidays2025,
  onEndDateChange,
  showRemainingDays = true,
}) => {
  const [internalStartDate, setInternalStartDate] = useState<Dayjs | null>(startDate);
  const [internalTatDays, setInternalTatDays] = useState<number>(tatDays);
  const [calculatedEndDate, setCalculatedEndDate] = useState<Dayjs | null>(null);
  const [tatInfo, setTatInfo] = useState<TATInfo | null>(null);

  const isWeekend = (date: Dayjs): boolean => {
    const day = date.day();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const isHoliday = (date: Dayjs): boolean => {
    return holidays.includes(date.format('YYYY-MM-DD'));
  };

  const isWorkingDay = (date: Dayjs): boolean => {
    if (excludeWeekends && isWeekend(date)) return false;
    if (excludeHolidays && isHoliday(date)) return false;
    return true;
  };

  const calculateEndDate = (start: Dayjs, workingDaysToAdd: number): Dayjs => {
    let current = start.clone();
    let daysAdded = 0;

    while (daysAdded < workingDaysToAdd) {
      current = current.add(1, 'day');
      if (isWorkingDay(current)) {
        daysAdded++;
      }
    }

    return current;
  };

  const countWorkingDays = (start: Dayjs, end: Dayjs): number => {
    let count = 0;
    let current = start.clone();

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      if (isWorkingDay(current)) {
        count++;
      }
      current = current.add(1, 'day');
    }

    return count;
  };

  const countWeekendDays = (start: Dayjs, end: Dayjs): number => {
    let count = 0;
    let current = start.clone();

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      if (isWeekend(current)) {
        count++;
      }
      current = current.add(1, 'day');
    }

    return count;
  };

  const countHolidayDays = (start: Dayjs, end: Dayjs): number => {
    let count = 0;
    let current = start.clone();

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      if (isHoliday(current) && !isWeekend(current)) {
        count++;
      }
      current = current.add(1, 'day');
    }

    return count;
  };

  const calculateTATInfo = (start: Dayjs | null, end: Dayjs | null): TATInfo => {
    const today = dayjs();

    if (!start || !end) {
      return {
        startDate: start,
        endDate: end,
        totalDays: 0,
        workingDays: 0,
        weekendDays: 0,
        holidayDays: 0,
        remainingDays: 0,
        isOverdue: false,
        status: 'on-track',
      };
    }

    const totalDays = end.diff(start, 'day') + 1;
    const workingDays = countWorkingDays(start, end);
    const weekendDays = countWeekendDays(start, end);
    const holidayDays = countHolidayDays(start, end);

    let remainingDays = 0;
    let isOverdue = false;
    let status: 'on-track' | 'warning' | 'overdue' = 'on-track';

    if (today.isBefore(end, 'day')) {
      remainingDays = countWorkingDays(today, end);
      if (remainingDays <= 2) {
        status = 'warning';
      }
    } else if (today.isAfter(end, 'day')) {
      isOverdue = true;
      remainingDays = -countWorkingDays(end, today);
      status = 'overdue';
    }

    return {
      startDate: start,
      endDate: end,
      totalDays,
      workingDays,
      weekendDays,
      holidayDays,
      remainingDays,
      isOverdue,
      status,
    };
  };

  useEffect(() => {
    if (internalStartDate && internalTatDays > 0) {
      const endDate = calculateEndDate(internalStartDate, internalTatDays);
      setCalculatedEndDate(endDate);
      const info = calculateTATInfo(internalStartDate, endDate);
      setTatInfo(info);
      onEndDateChange?.(endDate, info);
    } else {
      setCalculatedEndDate(null);
      setTatInfo(null);
    }
  }, [internalStartDate, internalTatDays, excludeWeekends, excludeHolidays]);

  const getStatusTag = () => {
    if (!tatInfo) return null;

    switch (tatInfo.status) {
      case 'overdue':
        return (
          <Tag color="error" icon={<WarningOutlined />}>
            Quá hạn {Math.abs(tatInfo.remainingDays)} ngày làm việc
          </Tag>
        );
      case 'warning':
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Còn {tatInfo.remainingDays} ngày làm việc
          </Tag>
        );
      default:
        return (
          <Tag color="success" icon={<ClockCircleOutlined />}>
            Còn {tatInfo.remainingDays} ngày làm việc
          </Tag>
        );
    }
  };

  return (
    <div>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          <Text>Ngày bắt đầu:</Text>
          <DatePicker
            value={internalStartDate}
            onChange={(date) => setInternalStartDate(date)}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày bắt đầu"
            style={{ width: 150 }}
          />
        </Space>

        <Space>
          <Text>Số ngày TAT:</Text>
          <InputNumber
            min={1}
            max={365}
            value={internalTatDays}
            onChange={(value) => setInternalTatDays(value || 5)}
            style={{ width: 100 }}
            addonAfter="ngày"
          />
          <Tooltip title="Không tính thứ 7, Chủ nhật và ngày lễ">
            <Text type="secondary">(ngày làm việc)</Text>
          </Tooltip>
        </Space>

        {calculatedEndDate && (
          <Space>
            <CalendarOutlined />
            <Text strong>
              Ngày hoàn thành dự kiến: {calculatedEndDate.format('DD/MM/YYYY')}
            </Text>
            {showRemainingDays && getStatusTag()}
          </Space>
        )}

        {tatInfo && (
          <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
            <Space wrap>
              <Text type="secondary">
                Tổng: {tatInfo.totalDays} ngày lịch
              </Text>
              <Text type="secondary">|</Text>
              <Text type="secondary">
                Làm việc: {tatInfo.workingDays} ngày
              </Text>
              {tatInfo.weekendDays > 0 && (
                <>
                  <Text type="secondary">|</Text>
                  <Text type="secondary">
                    Cuối tuần: {tatInfo.weekendDays} ngày
                  </Text>
                </>
              )}
              {tatInfo.holidayDays > 0 && (
                <>
                  <Text type="secondary">|</Text>
                  <Text type="secondary">
                    Nghỉ lễ: {tatInfo.holidayDays} ngày
                  </Text>
                </>
              )}
            </Space>
          </div>
        )}
      </Space>
    </div>
  );
};

// Export utility functions for use in other components
export const calculateWorkingEndDate = (
  startDate: Dayjs,
  workingDays: number,
  excludeWeekends: boolean = true,
  holidays: string[] = defaultHolidays2025
): Dayjs => {
  let current = startDate.clone();
  let daysAdded = 0;

  const isWeekend = (date: Dayjs): boolean => {
    const day = date.day();
    return day === 0 || day === 6;
  };

  const isHoliday = (date: Dayjs): boolean => {
    return holidays.includes(date.format('YYYY-MM-DD'));
  };

  while (daysAdded < workingDays) {
    current = current.add(1, 'day');
    const weekend = excludeWeekends && isWeekend(current);
    const holiday = isHoliday(current);
    if (!weekend && !holiday) {
      daysAdded++;
    }
  }

  return current;
};

export const getRemainingWorkingDays = (
  endDate: Dayjs,
  _excludeWeekends: boolean = true,
  holidays: string[] = defaultHolidays2025
): number => {
  const today = dayjs();
  let count = 0;
  let current = today.clone();

  const isWeekend = (date: Dayjs): boolean => {
    const day = date.day();
    return day === 0 || day === 6;
  };

  const isHoliday = (date: Dayjs): boolean => {
    return holidays.includes(date.format('YYYY-MM-DD'));
  };

  if (today.isAfter(endDate, 'day')) {
    // Count negative days (overdue)
    while (current.isAfter(endDate, 'day')) {
      if (!isWeekend(current) && !isHoliday(current)) {
        count--;
      }
      current = current.subtract(1, 'day');
    }
  } else {
    // Count remaining days
    while (current.isBefore(endDate, 'day') || current.isSame(endDate, 'day')) {
      if (!isWeekend(current) && !isHoliday(current)) {
        count++;
      }
      current = current.add(1, 'day');
    }
  }

  return count;
};

export default TATCalculator;
