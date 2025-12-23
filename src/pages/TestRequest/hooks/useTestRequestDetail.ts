import { useCallback } from "react";
import { message } from "antd";
import {
  useGetTestRequestQuery,
  useGenerateTestRequestFormMutation,
  useUpdateToPendingApprovalMutation,
  useApproveTestRequestMutation,
  useSendResultMutation,
  useCompleteTestRequestMutation,
} from "../../../store/api/testRequestApi";
import { DETAIL_MESSAGES } from "../constants";

export const useTestRequestDetail = (id: string | undefined) => {
  // RTK Query hooks
  const {
    data,
    isLoading: loading,
    refetch,
  } = useGetTestRequestQuery(id!, { skip: !id });

  // Mutations
  const [generateTestRequestForm, { isLoading: printingTestRequest }] = useGenerateTestRequestFormMutation();
  const [updateToPendingApproval] = useUpdateToPendingApprovalMutation();
  const [approveTestRequest] = useApproveTestRequestMutation();
  const [sendResult] = useSendResultMutation();
  const [completeTestRequest] = useCompleteTestRequestMutation();

  // Handle print test request form
  const handlePrintTestRequest = useCallback(async (): Promise<string | null> => {
    if (!id) return null;
    try {
      const result = await generateTestRequestForm(id).unwrap();
      message.success(DETAIL_MESSAGES.printSuccess(result.requestNumber));
      return result.fileName;
    } catch (error: any) {
      console.error("Error printing test request:", error);
      message.error(error?.data?.error?.message || DETAIL_MESSAGES.printError);
      return null;
    }
  }, [id, generateTestRequestForm]);

  // Handle print mixed result (placeholder)
  const handlePrintMixedResult = useCallback(() => {
    message.info(DETAIL_MESSAGES.mixedResultInfo);
  }, []);

  // Handle send result
  const handleSendResult = useCallback(async () => {
    if (!id) return;
    try {
      await sendResult(id).unwrap();
      message.success(DETAIL_MESSAGES.sendResultSuccess);
    } catch (error: any) {
      console.error("Error sending result:", error);
      message.error(error?.data?.error?.message || DETAIL_MESSAGES.sendResultError);
    }
  }, [id, sendResult]);

  // Handle approve test request
  const handleApprove = useCallback(async () => {
    if (!id) return;
    try {
      await approveTestRequest(id).unwrap();
      message.success(DETAIL_MESSAGES.approveSuccess);
    } catch (error: any) {
      console.error("Error approving test request:", error);
      message.error(error?.data?.error?.message || DETAIL_MESSAGES.approveError);
    }
  }, [id, approveTestRequest]);

  // Handle complete test request
  const handleComplete = useCallback(async () => {
    if (!id) return;
    try {
      await completeTestRequest(id).unwrap();
      message.success(DETAIL_MESSAGES.completeSuccess);
    } catch (error: any) {
      console.error("Error completing test request:", error);
      message.error(error?.data?.error?.message || DETAIL_MESSAGES.completeError);
    }
  }, [id, completeTestRequest]);

  // Update to pending approval
  const handleUpdateToPendingApproval = useCallback(async () => {
    if (!id) return;
    try {
      await updateToPendingApproval(id).unwrap();
    } catch (error: any) {
      console.error("Error updating to pending approval:", error);
      throw error;
    }
  }, [id, updateToPendingApproval]);

  return {
    data,
    loading,
    refetch,
    printingTestRequest,
    handlePrintTestRequest,
    handlePrintMixedResult,
    handleSendResult,
    handleApprove,
    handleComplete,
    handleUpdateToPendingApproval,
  };
};
