import type { Dayjs } from "dayjs";
import { SampleStatus } from "../../../types/testRequest";

export interface SampleFormData {
  key: string;
  id?: string;
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  indicatorIds: string[];
}

export interface IndicatorDates {
  transferDate?: Dayjs;
  requestDate?: Dayjs;
}

export interface LaboratoryAssignment {
  laboratoryId: string;
  laboratoryName: string;
  requestDate: Dayjs;
}

export interface IndicatorTreeNode {
  title: string;
  value: string;
  key: string;
  selectable?: boolean;
  children?: IndicatorTreeNode[];
}

export interface OrganizationOption {
  value: string;
  label: string;
}