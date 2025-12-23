import { useState, useCallback } from "react";
import { message } from "antd";
import {
  useGetSamplesForResultFormQuery,
  useGenerateBM01ResultFormMutation,
  SampleForSelectionDto,
} from "../../../store/api/testRequestApi";
import { DETAIL_MESSAGES } from "../constants";

interface UseBM01ModalOptions {
  testRequestId: string | undefined;
  onUpdateToPendingApproval: () => Promise<void>;
  onOpenEditor: (fileName: string) => void;
}

export const useBM01Modal = ({
  testRequestId,
  onUpdateToPendingApproval,
  onOpenEditor,
}: UseBM01ModalOptions) => {
  const [sampleSelectionModalVisible, setSampleSelectionModalVisible] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // RTK Query for samples
  const {
    data: samplesForSelection = [],
    isLoading: loadingSamples,
  } = useGetSamplesForResultFormQuery(testRequestId!, {
    skip: !testRequestId || !sampleSelectionModalVisible,
  });

  // Mutation
  const [generateBM01ResultForm, { isLoading: generatingBM01 }] = useGenerateBM01ResultFormMutation();

  // Handle BM01 - Open sample selection modal
  const handleOpenBM01Modal = useCallback(() => {
    setSampleSelectionModalVisible(true);
    setSelectedSampleId(null);
  }, []);

  // Handle BM01 - Close modal
  const handleCloseBM01Modal = useCallback(() => {
    setSampleSelectionModalVisible(false);
    setSelectedSampleId(null);
  }, []);

  // Handle BM01 - Generate result form
  const handleGenerateBM01 = useCallback(async () => {
    if (!testRequestId || !selectedSampleId) {
      message.warning(DETAIL_MESSAGES.selectSampleWarning);
      return;
    }

    const selectedSample = samplesForSelection.find((s: SampleForSelectionDto) => s.id === selectedSampleId);
    if (selectedSample && !selectedSample.canGenerateResult) {
      message.error(DETAIL_MESSAGES.sampleNotReady);
      return;
    }

    try {
      // Step 1: Generate the document
      const result = await generateBM01ResultForm({
        testRequestId,
        sampleId: selectedSampleId,
      }).unwrap();
      message.success(DETAIL_MESSAGES.bm01Success(result.sampleCode));

      // Step 2: Update status to PendingApproval after printing result form
      await onUpdateToPendingApproval();

      // Step 3: Close selection modal
      setSampleSelectionModalVisible(false);

      // Step 4: Open editor with the generated file
      onOpenEditor(result.fileName);
    } catch (error: any) {
      console.error("Error generating BM01 result form:", error);
      message.error(error?.data?.error?.message || DETAIL_MESSAGES.bm01Error);
    }
  }, [testRequestId, selectedSampleId, samplesForSelection, generateBM01ResultForm, onUpdateToPendingApproval, onOpenEditor]);

  // Handle sample selection
  const handleSelectSample = useCallback((sampleId: string) => {
    const sample = samplesForSelection.find((s: SampleForSelectionDto) => s.id === sampleId);
    if (sample?.canGenerateResult) {
      setSelectedSampleId(sampleId);
    }
  }, [samplesForSelection]);

  // Check if selected sample can generate result
  const canGenerateSelectedSample = useCallback(() => {
    if (!selectedSampleId) return false;
    const sample = samplesForSelection.find((s: SampleForSelectionDto) => s.id === selectedSampleId);
    return sample?.canGenerateResult ?? false;
  }, [selectedSampleId, samplesForSelection]);

  return {
    sampleSelectionModalVisible,
    selectedSampleId,
    samplesForSelection,
    loadingSamples,
    generatingBM01,
    handleOpenBM01Modal,
    handleCloseBM01Modal,
    handleGenerateBM01,
    handleSelectSample,
    canGenerateSelectedSample,
  };
};
