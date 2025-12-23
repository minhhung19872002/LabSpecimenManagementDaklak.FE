import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import { SampleFormData } from "../types";
import { SampleStatus } from "../../../types/testRequest";
import { FORM_MESSAGES } from "../constants";

interface UseSampleManagementOptions {
  isSamplesLocked: () => boolean;
  indicators: any[];
}

export const useSampleManagement = ({ isSamplesLocked, indicators }: UseSampleManagementOptions) => {
  const [samples, setSamples] = useState<SampleFormData[]>([]);
  const [totalSampleCost, setTotalSampleCost] = useState(0);

  const addSample = useCallback(() => {
    if (isSamplesLocked()) {
      message.warning(FORM_MESSAGES.cannotAddSample);
      return;
    }

    const newSample: SampleFormData = {
      key: `new-${Date.now()}`,
      sortOrder: samples.length + 1,
      sampleCode: "",
      sampleName: "",
      samplingAddress: "",
      sampleQuantity: "",
      status: SampleStatus.Normal,
      statusText: "",
      processingStatus: "",
      notes: "",
      storageLocation: "",
      indicatorIds: [],
    };
    setSamples((prev) => [...prev, newSample]);
  }, [samples.length, isSamplesLocked]);

  const removeSample = useCallback(
    (key: string) => {
      if (isSamplesLocked()) {
        message.warning(FORM_MESSAGES.cannotDeleteSample);
        return;
      }
      setSamples((prev) => prev.filter((s) => s.key !== key));
    },
    [isSamplesLocked]
  );

  const updateSample = useCallback(
    (key: string, field: keyof SampleFormData, value: any) => {
      if (isSamplesLocked()) {
        return;
      }
      setSamples((prev) =>
        prev.map((s) => (s.key === key ? { ...s, [field]: value } : s))
      );
    },
    [isSamplesLocked]
  );

  const getIndicatorInfo = useCallback(
    (indicatorId: string) => {
      return indicators.find((ind) => ind.id === indicatorId);
    },
    [indicators]
  );

  // Calculate total cost when samples change
  useEffect(() => {
    let total = 0;
    samples.forEach((sample) => {
      sample.indicatorIds.forEach((indId) => {
        const indicator = indicators.find((i) => i.id === indId);
        if (indicator) {
          total += indicator.unitPrice;
        }
      });
    });
    setTotalSampleCost(total);
  }, [samples, indicators]);

  return {
    samples,
    setSamples,
    totalSampleCost,
    addSample,
    removeSample,
    updateSample,
    getIndicatorInfo,
  };
};
