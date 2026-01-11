import React from 'react';
import { Button, Badge, Tooltip } from 'antd';
import { CameraOutlined } from '../../../components/common/Icon';
import { TestRequestSampleDto } from '../../../types/testRequest';

interface SampleImagesButtonProps {
  sample: TestRequestSampleDto;
  onClick: () => void;
}

/**
 * Button nhỏ hiển thị icon camera và tổng số hình ảnh của mẫu.
 * Click để mở SampleImagesModal.
 */
const SampleImagesButton: React.FC<SampleImagesButtonProps> = ({
  sample,
  onClick,
}) => {
  const attachmentCount = sample.attachments?.length || 0;
  const beforeTestingCount = sample.beforeTestingImages?.length || 0;
  const afterTestingCount = sample.afterTestingImages?.length || 0;
  const totalCount = attachmentCount + beforeTestingCount + afterTestingCount;

  const tooltipContent = (
    <div style={{ fontSize: 12 }}>
      <div>Hình mẫu: {attachmentCount}</div>
      <div>Trước TN: {beforeTestingCount}</div>
      <div>Sau TN: {afterTestingCount}</div>
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="top">
      <Badge
        count={totalCount}
        size="small"
        offset={[-2, 2]}
        style={{
          backgroundColor: totalCount > 0 ? '#1890ff' : '#d9d9d9',
        }}
      >
        <Button
          type="text"
          icon={<CameraOutlined />}
          size="small"
          onClick={onClick}
          style={{
            color: totalCount > 0 ? '#1890ff' : '#bfbfbf',
          }}
        />
      </Badge>
    </Tooltip>
  );
};

export default SampleImagesButton;
