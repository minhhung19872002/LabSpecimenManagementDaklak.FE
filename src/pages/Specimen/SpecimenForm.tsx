import React from 'react';
import { Form, Card, Divider, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

import { useSpecimenForm } from './hooks/useSpecimenForm';
import { SPECIMEN_FORM_INITIAL_VALUES } from './constants/specimenForm.constants';
import {
  SpecimenInfoSection,
  SpecimenImagesSection,
  SpecimenDeviationSection,
  SpecimenStatusSection,
  SpecimenNotesSection,
  SpecimenFormActions,
} from './components/form';

const SpecimenForm: React.FC = () => {
  const { t } = useTranslation();
  const {
    form,
    isEditMode,
    loading,
    loadingSpecimen,
    specimenImages,
    setSpecimenImages,
    testRequests,
    specimenTypes,
    storageLocations,
    onFinish,
    handleCancel,
  } = useSpecimenForm();

  if (loadingSpecimen && isEditMode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card title={isEditMode ? t('specimen.editSpecimen') : t('specimen.createSpecimen')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={SPECIMEN_FORM_INITIAL_VALUES}
      >
        <SpecimenInfoSection
          testRequests={testRequests}
          specimenTypes={specimenTypes}
          storageLocations={storageLocations}
        />

        <Divider />

        <SpecimenImagesSection
          specimenImages={specimenImages}
          setSpecimenImages={setSpecimenImages}
        />

        <Divider />

        <SpecimenDeviationSection />

        {isEditMode && <Divider />}
        <SpecimenStatusSection isEditMode={isEditMode} />

        <Divider />

        <SpecimenNotesSection />

        <SpecimenFormActions
          isEditMode={isEditMode}
          loading={loading}
          onCancel={handleCancel}
        />
      </Form>
    </Card>
  );
};

export default SpecimenForm;
