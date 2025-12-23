import { useState, useEffect, useMemo } from 'react';
import { Form, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import {
  useGetSpecimenQuery,
  useCreateSpecimenMutation,
  useUpdateSpecimenMutation,
} from '../../../store/api/specimenApi';
import { useGetTestRequestListQuery } from '../../../store/api/testRequestApi';
import {
  useGetActiveSpecimenTypesQuery,
  useGetActiveStorageLocationsQuery,
} from '../../../store/api/masterDataApi';

export const useSpecimenForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [specimenImages, setSpecimenImages] = useState<any[]>([]);
  const isEditMode = !!id;

  // RTK Query hooks
  const { data: specimenData, isLoading: loadingSpecimen } = useGetSpecimenQuery(id!, { skip: !id });
  const { data: testRequestsData } = useGetTestRequestListQuery({ maxResultCount: 1000 });
  const { data: specimenTypesData } = useGetActiveSpecimenTypesQuery();
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();

  // Mutations
  const [createSpecimen, { isLoading: isCreating }] = useCreateSpecimenMutation();
  const [updateSpecimen, { isLoading: isUpdating }] = useUpdateSpecimenMutation();

  // Derived data
  const testRequests = useMemo(() => {
    const items = testRequestsData?.items || [];
    return items.map((tr: any) => ({
      id: tr.id,
      requestNumber: tr.requestNumber,
      customerName: tr.customerName,
    }));
  }, [testRequestsData]);

  const specimenTypes = useMemo(() => specimenTypesData?.items || [], [specimenTypesData]);
  const storageLocations = useMemo(() => storageLocationsData?.items || [], [storageLocationsData]);
  const loading = isCreating || isUpdating;

  // Set form values when specimen data is loaded
  useEffect(() => {
    if (specimenData && isEditMode) {
      form.setFieldsValue({
        ...specimenData,
        receivedDate: specimenData.receivedDate ? dayjs(specimenData.receivedDate) : null,
      });
      // Parse images from string if available
      if (specimenData.images) {
        try {
          const parsedImages = JSON.parse(specimenData.images);
          if (Array.isArray(parsedImages)) {
            setSpecimenImages(parsedImages);
          }
        } catch {
          // If not JSON, ignore
        }
      }
    }
  }, [specimenData, isEditMode, form]);

  const onFinish = async (values: any) => {
    try {
      const payload = {
        ...values,
        receivedDate: values.receivedDate ? values.receivedDate.toISOString() : new Date().toISOString(),
        images: specimenImages.length > 0
          ? JSON.stringify(specimenImages.map(f => ({
              name: f.name,
              url: f.url || f.response?.url,
              type: f.type,
            })))
          : undefined,
      };

      if (isEditMode && id) {
        await updateSpecimen({ id, data: payload }).unwrap();
        message.success(t('messages.updateSuccess'));
      } else {
        await createSpecimen(payload).unwrap();
        message.success(t('messages.createSuccess'));
      }
      navigate('/specimens');
    } catch (error: any) {
      console.error('Failed to save specimen:', error);
      message.error(error?.data?.error?.message || (isEditMode ? t('messages.updateFailed') : t('messages.createFailed')));
    }
  };

  const handleCancel = () => {
    navigate('/specimens');
  };

  return {
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
    t,
  };
};
