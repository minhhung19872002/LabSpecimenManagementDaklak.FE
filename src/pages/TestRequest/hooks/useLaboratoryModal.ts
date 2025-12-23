import { useState, useCallback } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { LaboratoryAssignment, IndicatorDates } from "../types";
import { FORM_MESSAGES } from "../constants";

interface UseLaboratoryModalOptions {
  checkedIndicators: string[];
  setCheckedIndicators: (value: string[]) => void;
  currentSampleKey: string | null;
  laboratories: any[];
  setSelectedIndicatorDates: React.Dispatch<React.SetStateAction<Record<string, IndicatorDates>>>;
  setIndicatorLaboratoryMap: React.Dispatch<React.SetStateAction<Record<string, LaboratoryAssignment>>>;
  setExpandedLabGroups: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useLaboratoryModal = ({
  checkedIndicators,
  setCheckedIndicators,
  currentSampleKey,
  laboratories,
  setSelectedIndicatorDates,
  setIndicatorLaboratoryMap,
  setExpandedLabGroups,
}: UseLaboratoryModalOptions) => {
  const [laboratoryModalVisible, setLaboratoryModalVisible] = useState(false);
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState<string | null>(null);
  const [laboratoryRequestDate, setLaboratoryRequestDate] = useState<dayjs.Dayjs | null>(null);
  const [indicatorsToSend, setIndicatorsToSend] = useState<string[]>([]);

  const handleSendToLaboratory = useCallback(() => {
    if (checkedIndicators.length === 0) {
      message.warning(FORM_MESSAGES.selectIndicatorFirst);
      return;
    }
    setIndicatorsToSend([...checkedIndicators]);
    setLaboratoryRequestDate(null);
    setSelectedLaboratoryId(null);
    setLaboratoryModalVisible(true);
  }, [checkedIndicators]);

  const handleConfirmSendToLaboratory = useCallback(() => {
    if (!selectedLaboratoryId) {
      message.warning(FORM_MESSAGES.selectLaboratory);
      return;
    }

    if (!laboratoryRequestDate) {
      message.warning(FORM_MESSAGES.selectRequestDate);
      return;
    }

    const selectedLab = laboratories.find((d) => d.id === selectedLaboratoryId);
    const labName = selectedLab?.name || "khoa phòng";

    // Update request dates
    setSelectedIndicatorDates((prev) => {
      const updated = { ...prev };
      indicatorsToSend.forEach((id) => {
        updated[id] = {
          ...updated[id],
          requestDate: laboratoryRequestDate,
        };
      });
      return updated;
    });

    // Store laboratory assignment
    setIndicatorLaboratoryMap((prev) => {
      const updated = { ...prev };
      indicatorsToSend.forEach((id) => {
        const key = `${currentSampleKey}_${id}`;
        updated[key] = {
          laboratoryId: selectedLaboratoryId,
          laboratoryName: labName,
          requestDate: laboratoryRequestDate,
        };
      });
      return updated;
    });

    // Auto expand lab group
    setExpandedLabGroups((prev) => {
      if (!prev.includes(selectedLaboratoryId)) {
        return [...prev, selectedLaboratoryId];
      }
      return prev;
    });

    message.success(FORM_MESSAGES.sentToLaboratory(indicatorsToSend.length, labName));
    setLaboratoryModalVisible(false);
    setCheckedIndicators([]);
  }, [
    selectedLaboratoryId,
    laboratoryRequestDate,
    laboratories,
    indicatorsToSend,
    currentSampleKey,
    setSelectedIndicatorDates,
    setIndicatorLaboratoryMap,
    setExpandedLabGroups,
    setCheckedIndicators,
  ]);

  const handleCancelLaboratoryModal = useCallback(() => {
    setLaboratoryModalVisible(false);
    setSelectedLaboratoryId(null);
    setLaboratoryRequestDate(null);
    setIndicatorsToSend([]);
  }, []);

  return {
    laboratoryModalVisible,
    selectedLaboratoryId,
    setSelectedLaboratoryId,
    laboratoryRequestDate,
    setLaboratoryRequestDate,
    indicatorsToSend,
    handleSendToLaboratory,
    handleConfirmSendToLaboratory,
    handleCancelLaboratoryModal,
  };
};
