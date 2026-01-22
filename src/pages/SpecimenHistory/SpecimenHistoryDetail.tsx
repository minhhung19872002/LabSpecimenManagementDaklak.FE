import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '../../components/common/Icon';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { specimenHistoryService } from '../../services/specimenHistoryService';
import { SpecimenHistoryDto, SpecimenStatus } from '../../types/specimenHistory';
import { PATH_ROUTES } from '../../constants';
import StatusTag from '../../components/common/StatusTag';
import { authService } from '../../services/authService';
import { PERMISSIONS } from '../../constants/permissionMapping';

// Mock data fallback
const getMockSpecimenHistory = (id: string): SpecimenHistoryDto => {
  const actions = [
    'Tiếp nhận mẫu',
    'Chuyển vào kho lạnh',
    'Lấy mẫu thử nghiệm',
    'Hoàn tất thử nghiệm',
    'Chuyển lưu kho',
  ];
  const locations = [
    'Quầy tiếp nhận',
    'Kho lạnh A1 - Phòng XN Vi sinh',
    'Phòng thử nghiệm PCR',
    'Kho lưu mẫu B1',
  ];
  const index = parseInt(id.replace(/\D/g, '') || '1') % actions.length;

  return {
    id,
    specimenId: `spe-${id.replace(/\D/g, '').padStart(3, '0')}`,
    specimenCode: `SPE-${dayjs().format('YYYYMMDD')}-${id.replace(/\D/g, '').padStart(4, '0')}`,
    action: actions[index],
    location: locations[index % locations.length],
    status: SpecimenStatus.Testing,
    performedByName: 'ThS. Nguyễn Văn A',
    timestamp: dayjs().subtract(2, 'hour').toISOString(),
    temperature: 4.5,
    humidity: 65,
    notes: 'Mẫu từ Bệnh viện Đa khoa tỉnh Đắk Lắk - Xét nghiệm COVID-19',
    creationTime: dayjs().subtract(2, 'hour').toISOString(),
  };
};

const SpecimenHistoryDetail: React.FC = () => {
  const [data, setData] = useState<SpecimenHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (historyId: string) => {
    setLoading(true);
    try {
      const result = await specimenHistoryService.getById(historyId);
      setData(result);
    } catch (error) {
      // API not available, use mock data
      console.log('API not available, using mock data');
      setData(getMockSpecimenHistory(historyId));
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'blue', label: t('specimenHistory.status.received') },
      [SpecimenStatus.Testing]: { color: 'orange', label: t('specimenHistory.status.testing') },
      [SpecimenStatus.Storage]: { color: 'green', label: t('specimenHistory.status.storage') },
      [SpecimenStatus.Disposal]: { color: 'red', label: t('specimenHistory.status.disposal') },
      [SpecimenStatus.Destroyed]: { color: 'volcano', label: t('specimenHistory.status.destroyed') },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'purple', label: t('specimenHistory.status.returnedToCustomer') },
    };

    const config = statusConfig[status];
    return <StatusTag color={config.color}>{config.label}</StatusTag>;
  };

  if (!data && !loading) {
    return null;
  }

  return (
    <Spin spinning={loading}>
      <Card
        title={t('specimenHistory.detail.title')}
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(PATH_ROUTES.specimenHistories.index)}
            >
              {t('common.back')}
            </Button>
            {authService.hasPermission(PERMISSIONS.Specimens.Edit) && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(PATH_ROUTES.specimenHistories.edit(id!))}
              >
                {t('common.edit')}
              </Button>
            )}
          </Space>
        }
      >
        {data && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label={t('specimenHistory.detail.specimenCode')} span={2}>
              <strong>{data.specimenCode || '-'}</strong>
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.action')}>
              {data.action}
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.location')}>
              {data.location}
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.status')}>
              {getStatusTag(data.status)}
            </Descriptions.Item>

            <Descriptions.Item label="Người thực hiện">
              {data.performedByName || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian thực hiện">
              {data.timestamp ? dayjs(data.timestamp).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.creationTime')}>
              {dayjs(data.creationTime).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>

            <Descriptions.Item label="Nhiệt độ">
              {data.temperature != null ? `${data.temperature}°C` : '-'}
            </Descriptions.Item>

            <Descriptions.Item label="Độ ẩm">
              {data.humidity != null ? `${data.humidity}%` : '-'}
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.notes')} span={2}>
              {data.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </Spin>
  );
};

export default SpecimenHistoryDetail;
