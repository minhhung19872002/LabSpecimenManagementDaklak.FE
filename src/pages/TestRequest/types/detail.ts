import { TestRequestStatus, SampleStatus, ResultLanguage, SamplingRequirement, SampleStorageOption } from "../../../types/testRequest";

export interface StatusConfig {
  color: string;
  text: string;
}

export interface SampleStatusConfigs {
  [key: number]: StatusConfig;
}

export interface IndicatorDisplay {
  indicatorId: string;
  indicatorCode?: string;
  indicatorName: string;
  laboratoryId?: string;
  laboratoryName?: string;
  unitPrice: number;
  requestDate?: string;
}

export interface GroupedIndicators {
  labName: string;
  indicators: IndicatorDisplay[];
}

// Helper type for status tag rendering
export type StatusTagRenderer = (status: TestRequestStatus) => JSX.Element;
export type SampleStatusTagRenderer = (status: SampleStatus) => JSX.Element;

// Text helper types
export type ResultLanguageTextGetter = (lang: ResultLanguage) => string;
export type SamplingRequirementTextGetter = (req: SamplingRequirement) => string;
export type SampleStorageTextGetter = (opt: SampleStorageOption) => string;
