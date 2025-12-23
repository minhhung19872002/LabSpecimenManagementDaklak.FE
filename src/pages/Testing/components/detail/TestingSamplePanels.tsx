import React from "react";
import { Collapse, Space, Tag, Typography } from "antd";
import { TestingSampleDto, SaveIndicatorResultDto } from "../../../../types/testing";
import IndicatorEditTable from "../IndicatorEditTable";

const { Panel } = Collapse;
const { Text } = Typography;

interface TestingSamplePanelsProps {
  sortedSamples: TestingSampleDto[];
  activeKeys: string[];
  onActiveKeysChange: (keys: string[]) => void;
  onResultsChange: (sampleId: string, results: SaveIndicatorResultDto[]) => void;
  onShowRejectionHistory: (indicatorId: string, indicatorName: string) => void;
  onSaveIndicator: (indicatorId: string) => void;
  onSubmitForApproval: (indicatorId: string) => void;
  submittingIds: Set<string>;
}

const TestingSamplePanels: React.FC<TestingSamplePanelsProps> = ({
  sortedSamples,
  activeKeys,
  onActiveKeysChange,
  onResultsChange,
  onShowRejectionHistory,
  onSaveIndicator,
  onSubmitForApproval,
  submittingIds,
}) => {
  return (
    <Collapse
      activeKey={activeKeys}
      onChange={(keys) => onActiveKeysChange(keys as string[])}
    >
      {sortedSamples.map((sample) => (
        <Panel
          header={
            <Space>
              <Text strong>
                {sample.sampleCode} - {sample.sampleName}
              </Text>
              {sample.statusText && <Tag color="blue">{sample.statusText}</Tag>}
              <Text type="secondary">({sample.indicators.length} chỉ tiêu)</Text>
            </Space>
          }
          key={sample.sampleId}
        >
          <IndicatorEditTable
            indicators={sample.indicators}
            onResultsChange={(results) => onResultsChange(sample.sampleId, results)}
            onShowRejectionHistory={onShowRejectionHistory}
            onSaveIndicator={onSaveIndicator}
            onSubmitForApproval={onSubmitForApproval}
            submittingIds={submittingIds}
          />
        </Panel>
      ))}
    </Collapse>
  );
};

export default TestingSamplePanels;
