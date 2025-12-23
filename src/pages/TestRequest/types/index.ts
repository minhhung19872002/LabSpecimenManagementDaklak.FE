import type { Dayjs } from "dayjs";
import { TestRequestStatus } from "../../../types/testRequest";

export interface TestRequestListFilters {
  searchText: string;
  searchInput: string;
  statusFilter: TestRequestStatus | "all";
  dateRange: [Dayjs | null, Dayjs | null] | null;
  currentPage: number;
  pageSize: number;
}

export interface TestRequestQueryParams {
  skipCount: number;
  maxResultCount: number;
  sorting: string;
  search?: string;
  status?: TestRequestStatus;
  expectedCompletionDateFrom?: string;
  expectedCompletionDateTo?: string;
}