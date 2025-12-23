import React from "react";
import { Card, Collapse, Row, Col, Space, Tag, Typography, Button } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import {
  SampleInfo,
  SampleStatus,
  SampleStatusLabels,
  SampleStatusColors,
  LaboratoryTaskIndicatorDto,
} from "../../../../types/laboratoryTask";
import IndicatorTable from "../IndicatorTable";

const { Text } = Typography;

interface TaskSampleListProps {
  sampleList: SampleInfo[];
  activeKeys: string[];
  onActiveKeysChange: (keys: string[]) => void;
  methods: any[];
  technicians: any[];
  canEditTask: boolean;
  actionLoading: boolean;
  onMethodChange: (indicatorId: string, methodId: string) => void;
  onTechnicianChange: (indicatorId: string, technicianId: string) => void;
  onAssignSample: (sampleId: string) => void;
  onApprove: (indicatorId: string, approve: boolean, reason?: string) => void;
}

const getSampleStatusTag = (status: SampleStatus) => (
  <Tag color={SampleStatusColors[status]}>{SampleStatusLabels[status]}</Tag>
);

const TaskSampleList: React.FC<TaskSampleListProps> = ({
  sampleList,
  activeKeys,
  onActiveKeysChange,
  methods,
  technicians,
  canEditTask,
  actionLoading,
  onMethodChange,
  onTechnicianChange,
  onAssignSample,
  onApprove,
}) => {
  const collapseItems = sampleList.map((sample) => ({
    key: sample.sampleId,
    label: (
      <Row justify="space-between" align="middle" style={{ width: "100%" }}>
        <Col>
          <Space>
            <Tag color="blue">{sample.sampleCode}</Tag>
            <Text strong>{sample.sampleName}</Text>
            <Text type="secondary">({sample.indicatorCount} chỉ tiêu)</Text>
            {getSampleStatusTag(sample.sampleStatus)}
          </Space>
        </Col>
        <Col>
          {canEditTask && (
            <Button
              type="primary"
              size="small"
              loading={actionLoading}
              onClick={(e) => {
                e.stopPropagation();
                onAssignSample(sample.sampleId);
              }}
            >
              {sample.sampleStatus === "pending" ? "Giao việc" : "Giao việc lại"}
            </Button>
          )}
        </Col>
      </Row>
    ),
    children: (
      <IndicatorTable
        indicators={sample.indicators}
        methods={methods}
        technicians={technicians}
        isAssigned={sample.sampleStatus !== "pending"}
        canEdit={canEditTask}
        onMethodChange={onMethodChange}
        onTechnicianChange={onTechnicianChange}
        onApprove={onApprove}
        loading={actionLoading}
      />
    ),
  }));

  return (
    <Card title={`Danh sách mẫu (${sampleList.length})`}>
      <Collapse
        activeKey={activeKeys}
        onChange={(keys) => onActiveKeysChange(keys as string[])}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        items={collapseItems}
      />
    </Card>
  );
};

export default TaskSampleList;
