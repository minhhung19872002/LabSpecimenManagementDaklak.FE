import { useState, useCallback } from "react";
import { Form, message } from "antd";
import dayjs from "dayjs";
import {
  useCreateSpecimenMutation,
  useUpdateSpecimenMutation,
} from "../../../store/api/specimenApi";
import { SpecimenStatus, SpecimenDto } from "../../../types/specimen";
import { SpecimenFormValues } from "../types";
import { MESSAGES } from "../constants";

export const useSpecimenModal = (
  generateSpecimenCode: (index: number) => string
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecimenDto | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [form] = Form.useForm<SpecimenFormValues>();

  const [createSpecimen, { isLoading: isCreating }] = useCreateSpecimenMutation();
  const [updateSpecimen, { isLoading: isUpdating }] = useUpdateSpecimenMutation();

  const actionLoading = isCreating || isUpdating;

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      testRequestId: undefined,
      specimens: [
        {
          code: generateSpecimenCode(0),
          receivedDate: dayjs(),
          name: "",
          type: undefined,
          quantity: 1,
          unit: "mẫu",
          status: SpecimenStatus.Received,
        },
      ],
    });
    setIsModalOpen(true);
  }, [form, generateSpecimenCode]);

  const handleEdit = useCallback((record: SpecimenDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      testRequestId: record.testRequestId,
      specimens: [
        {
          code: record.code,
          receivedDate: dayjs(record.receivedDate),
          name: record.name,
          type: record.type,
          quantity: record.quantity,
          unit: record.unit,
          status: record.status,
        },
      ],
      storageLocation: record.storageLocation,
      description: record.notes,
    });
    setIsModalOpen(true);
  }, [form]);

  const handleModalOk = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (editingItem) {
        // Edit mode - only one specimen
        const specimen = values.specimens[0];
        const updateData = {
          code: specimen.code,
          name: specimen.name,
          type: specimen.type || "",
          receivedDate: specimen.receivedDate.toISOString(),
          testRequestId: values.testRequestId,
          quantity: specimen.quantity,
          unit: specimen.unit,
          status: specimen.status,
          storageLocation: values.storageLocation,
          notes: values.description,
        };
        await updateSpecimen({ id: editingItem.id, data: updateData }).unwrap();
        message.success(MESSAGES.UPDATE_SUCCESS);
      } else {
        // Create mode - multiple specimens
        for (const specimen of values.specimens) {
          const createData = {
            code: specimen.code,
            name: specimen.name,
            type: specimen.type || "",
            receivedDate: specimen.receivedDate.toISOString(),
            testRequestId: values.testRequestId,
            quantity: specimen.quantity,
            unit: specimen.unit,
            status: specimen.status,
            storageLocation: values.storageLocation,
            notes: values.description,
          };
          await createSpecimen(createData).unwrap();
        }
        message.success(MESSAGES.CREATE_SUCCESS(values.specimens.length));
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      console.error("Error saving specimen:", error);
      message.error(error.data?.error?.message || MESSAGES.SAVE_ERROR);
    }
  }, [form, editingItem, createSpecimen, updateSpecimen]);

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleAddSpecimen = useCallback(() => {
    const currentSpecimens = form.getFieldValue("specimens") || [];
    const newSpecimen = {
      code: generateSpecimenCode(currentSpecimens.length),
      receivedDate: dayjs(),
      name: "",
      type: undefined,
      quantity: 1,
      unit: "mẫu",
      status: SpecimenStatus.Received,
    };
    form.setFieldsValue({
      specimens: [...currentSpecimens, newSpecimen],
    });
  }, [form, generateSpecimenCode]);

  return {
    // Modal state
    isModalOpen,
    editingItem,
    form,
    actionLoading,
    importModalOpen,
    setImportModalOpen,

    // Handlers
    handleCreate,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleAddSpecimen,
  };
};
