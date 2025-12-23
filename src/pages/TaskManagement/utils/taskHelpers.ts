import {
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  SampleInfo,
  SampleStatus,
} from "../../../types/laboratoryTask";

export const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const computeSampleStatus = (
  indicators: LaboratoryTaskIndicatorDto[]
): SampleStatus => {
  const allApproved = indicators.every(
    (i) => i.approvalStatus === IndicatorApprovalStatus.Approved
  );
  const allEntered = indicators.every(
    (i) => i.approvalStatus >= IndicatorApprovalStatus.Entered
  );
  const allAssigned = indicators.every((i) => i.methodId && i.technicianId);
  const hasAnyResult = indicators.some((i) => i.result);

  if (allApproved) return "approved";
  if (allEntered) return "pendingApproval";
  if (hasAnyResult) return "testing";
  if (allAssigned) return "assigned";
  return "pending";
};

export const buildSampleList = (
  indicatorsBySample: Record<string, LaboratoryTaskIndicatorDto[]>,
  indicatorChanges: Record<string, Partial<LaboratoryTaskIndicatorDto>>
): SampleInfo[] => {
  const samples = Object.entries(indicatorsBySample).map(([sampleId, indicators]) => {
    // Merge local changes with server data for display
    const mergedIndicators = indicators.map((ind) => ({
      ...ind,
      ...indicatorChanges[ind.id],
    }));

    // Compute sample status from SERVER DATA (không dùng local changes)
    const sampleStatus = computeSampleStatus(indicators);
    const isApproved = indicators.every(
      (i) => i.approvalStatus === IndicatorApprovalStatus.Approved
    );

    return {
      sampleId,
      sampleCode: indicators[0]?.sampleCode,
      sampleName: indicators[0]?.sampleName,
      indicatorCount: indicators.length,
      indicators: mergedIndicators as LaboratoryTaskIndicatorDto[],
      sampleStatus,
      isApproved,
    };
  });

  // Sort by sampleId to maintain consistent order
  return samples.sort((a, b) => a.sampleId.localeCompare(b.sampleId));
};
