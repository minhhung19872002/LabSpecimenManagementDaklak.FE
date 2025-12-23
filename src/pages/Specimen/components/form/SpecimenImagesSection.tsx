import React from 'react';
import { Form, Typography } from 'antd';
import FileUpload from '../../../../components/common/FileUpload';
import { SPECIMEN_IMAGE_CONFIG } from '../../constants/specimenForm.constants';

const { Title } = Typography;

interface SpecimenImagesSectionProps {
  specimenImages: any[];
  setSpecimenImages: (images: any[]) => void;
}

const SpecimenImagesSection: React.FC<SpecimenImagesSectionProps> = ({
  specimenImages,
  setSpecimenImages,
}) => {
  return (
    <>
      <Title level={5}>Hình ảnh mẫu</Title>
      <Form.Item
        label="Đính kèm hình ảnh mẫu (chụp khi tiếp nhận)"
        tooltip="Hỗ trợ: JPG, PNG, GIF. Tối đa 10 hình, mỗi hình ≤ 5MB"
      >
        <FileUpload
          value={specimenImages}
          onChange={setSpecimenImages}
          maxCount={SPECIMEN_IMAGE_CONFIG.maxCount}
          accept={SPECIMEN_IMAGE_CONFIG.accept}
          maxSize={SPECIMEN_IMAGE_CONFIG.maxSize}
          listType={SPECIMEN_IMAGE_CONFIG.listType}
        />
      </Form.Item>
    </>
  );
};

export default SpecimenImagesSection;