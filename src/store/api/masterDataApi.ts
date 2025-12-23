import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import {
  PagedAndSortedResultRequestDto,
  DepartmentDto,
  CreateUpdateDepartmentDto,
  SpecimenTypeDto,
  CreateUpdateSpecimenTypeDto,
  TestMethodDto,
  CreateUpdateTestMethodDto,
  StorageLocationDto,
  CreateUpdateStorageLocationDto,
  CustomerDto,
  CreateUpdateCustomerDto,
  LaboratoryDto,
  CreateUpdateLaboratoryDto,
  IndicatorGroupDto,
  CreateUpdateIndicatorGroupDto,
  IndicatorDto,
  CreateIndicatorDto,
  UpdateIndicatorDto,
  IndicatorFilterDto,
  CreateBulkIndicatorsDto,
} from '../../services/masterDataService';
import { PagedResultDto } from '../../services/api';

// API URLs
const DEPARTMENT_URL = '/api/v1/departments';
const SPECIMEN_TYPE_URL = '/api/v1/specimen-types';
const TEST_METHOD_URL = '/api/v1/test-methods';
const STORAGE_LOCATION_URL = '/api/v1/storage-locations';
const CUSTOMER_URL = '/api/v1/customers';
const INDICATOR_GROUP_URL = '/api/v1/indicator-groups';
const INDICATOR_URL = '/api/v1/indicators';
const LABORATORY_URL = '/api/v1/laboratories';
const FORM_TEMPLATE_URL = '/api/v1/form-templates';
const MASTER_DATA_STATISTICS_URL = '/api/v1/master-data/statistics';

// FormTemplate DTO
export interface FormTemplateDto {
  fileName: string;
  name: string;
}

// Statistics DTO
export interface MasterDataStatisticsDto {
  departmentCount: number;
  laboratoryCount: number;
  specimenTypeCount: number;
  testMethodCount: number;
  storageLocationCount: number;
  customerCount: number;
  indicatorGroupCount: number;
  indicatorCount: number;
  formTemplateCount: number;
}

export const masterDataApi = createApi({
  reducerPath: 'masterDataApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Department',
    'SpecimenType',
    'TestMethod',
    'StorageLocation',
    'Customer',
    'Laboratory',
    'IndicatorGroup',
    'Indicator',
    'FormTemplate',
    'MasterDataStatistics',
  ],
  endpoints: (builder) => ({
    // ============= Department =============
    getDepartmentList: builder.query<PagedResultDto<DepartmentDto>, PagedAndSortedResultRequestDto>({
      query: (params) => ({
        url: DEPARTMENT_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'Department', id: 'LIST' }],
    }),
    getDepartment: builder.query<DepartmentDto, string>({
      query: (id) => `${DEPARTMENT_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Department', id }],
    }),
    getActiveDepartments: builder.query<PagedResultDto<DepartmentDto>, void>({
      query: () => `${DEPARTMENT_URL}/active`,
      transformResponse: (response: DepartmentDto[]) => ({
        items: response,
        totalCount: response.length,
      }),
      providesTags: [{ type: 'Department', id: 'ACTIVE' }],
    }),
    createDepartment: builder.mutation<DepartmentDto, CreateUpdateDepartmentDto>({
      query: (data) => ({
        url: DEPARTMENT_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }, { type: 'Department', id: 'ACTIVE' }],
    }),
    updateDepartment: builder.mutation<DepartmentDto, { id: string; data: CreateUpdateDepartmentDto }>({
      query: ({ id, data }) => ({
        url: `${DEPARTMENT_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Department', id },
        { type: 'Department', id: 'LIST' },
        { type: 'Department', id: 'ACTIVE' },
      ],
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({
        url: `${DEPARTMENT_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }, { type: 'Department', id: 'ACTIVE' }],
    }),

    // ============= SpecimenType =============
    getSpecimenTypeList: builder.query<PagedResultDto<SpecimenTypeDto>, PagedAndSortedResultRequestDto>({
      query: (params) => ({
        url: SPECIMEN_TYPE_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'SpecimenType', id: 'LIST' }],
    }),
    getSpecimenType: builder.query<SpecimenTypeDto, string>({
      query: (id) => `${SPECIMEN_TYPE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'SpecimenType', id }],
    }),
    getActiveSpecimenTypes: builder.query<PagedResultDto<SpecimenTypeDto>, void>({
      query: () => `${SPECIMEN_TYPE_URL}/active`,
      transformResponse: (response: SpecimenTypeDto[]) => ({
        items: response,
        totalCount: response.length,
      }),
      providesTags: [{ type: 'SpecimenType', id: 'ACTIVE' }],
    }),
    createSpecimenType: builder.mutation<SpecimenTypeDto, CreateUpdateSpecimenTypeDto>({
      query: (data) => ({
        url: SPECIMEN_TYPE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'SpecimenType', id: 'LIST' }, { type: 'SpecimenType', id: 'ACTIVE' }],
    }),
    updateSpecimenType: builder.mutation<SpecimenTypeDto, { id: string; data: CreateUpdateSpecimenTypeDto }>({
      query: ({ id, data }) => ({
        url: `${SPECIMEN_TYPE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'SpecimenType', id },
        { type: 'SpecimenType', id: 'LIST' },
        { type: 'SpecimenType', id: 'ACTIVE' },
      ],
    }),
    deleteSpecimenType: builder.mutation<void, string>({
      query: (id) => ({
        url: `${SPECIMEN_TYPE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SpecimenType', id: 'LIST' }, { type: 'SpecimenType', id: 'ACTIVE' }],
    }),

    // ============= TestMethod =============
    getTestMethodList: builder.query<PagedResultDto<TestMethodDto>, PagedAndSortedResultRequestDto>({
      query: (params) => ({
        url: TEST_METHOD_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'TestMethod', id: 'LIST' }],
    }),
    getTestMethod: builder.query<TestMethodDto, string>({
      query: (id) => `${TEST_METHOD_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'TestMethod', id }],
    }),
    getActiveTestMethods: builder.query<PagedResultDto<TestMethodDto>, void>({
      query: () => `${TEST_METHOD_URL}/active`,
      transformResponse: (response: TestMethodDto[]) => ({
        items: response,
        totalCount: response.length,
      }),
      providesTags: [{ type: 'TestMethod', id: 'ACTIVE' }],
    }),
    createTestMethod: builder.mutation<TestMethodDto, CreateUpdateTestMethodDto>({
      query: (data) => ({
        url: TEST_METHOD_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'TestMethod', id: 'LIST' }, { type: 'TestMethod', id: 'ACTIVE' }],
    }),
    updateTestMethod: builder.mutation<TestMethodDto, { id: string; data: CreateUpdateTestMethodDto }>({
      query: ({ id, data }) => ({
        url: `${TEST_METHOD_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestMethod', id },
        { type: 'TestMethod', id: 'LIST' },
        { type: 'TestMethod', id: 'ACTIVE' },
      ],
    }),
    deleteTestMethod: builder.mutation<void, string>({
      query: (id) => ({
        url: `${TEST_METHOD_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'TestMethod', id: 'LIST' }, { type: 'TestMethod', id: 'ACTIVE' }],
    }),

    // ============= StorageLocation =============
    getStorageLocationList: builder.query<PagedResultDto<StorageLocationDto>, PagedAndSortedResultRequestDto>({
      query: (params) => ({
        url: STORAGE_LOCATION_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'StorageLocation', id: 'LIST' }],
    }),
    getStorageLocation: builder.query<StorageLocationDto, string>({
      query: (id) => `${STORAGE_LOCATION_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'StorageLocation', id }],
    }),
    getActiveStorageLocations: builder.query<PagedResultDto<StorageLocationDto>, void>({
      query: () => `${STORAGE_LOCATION_URL}/active`,
      transformResponse: (response: StorageLocationDto[]) => ({
        items: response,
        totalCount: response.length,
      }),
      providesTags: [{ type: 'StorageLocation', id: 'ACTIVE' }],
    }),
    getAvailableStorageLocations: builder.query<StorageLocationDto[], void>({
      query: () => `${STORAGE_LOCATION_URL}/available`,
      providesTags: [{ type: 'StorageLocation', id: 'AVAILABLE' }],
    }),
    createStorageLocation: builder.mutation<StorageLocationDto, CreateUpdateStorageLocationDto>({
      query: (data) => ({
        url: STORAGE_LOCATION_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'StorageLocation', id: 'LIST' },
        { type: 'StorageLocation', id: 'ACTIVE' },
        { type: 'StorageLocation', id: 'AVAILABLE' },
      ],
    }),
    updateStorageLocation: builder.mutation<StorageLocationDto, { id: string; data: CreateUpdateStorageLocationDto }>({
      query: ({ id, data }) => ({
        url: `${STORAGE_LOCATION_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'StorageLocation', id },
        { type: 'StorageLocation', id: 'LIST' },
        { type: 'StorageLocation', id: 'ACTIVE' },
        { type: 'StorageLocation', id: 'AVAILABLE' },
      ],
    }),
    deleteStorageLocation: builder.mutation<void, string>({
      query: (id) => ({
        url: `${STORAGE_LOCATION_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'StorageLocation', id: 'LIST' },
        { type: 'StorageLocation', id: 'ACTIVE' },
        { type: 'StorageLocation', id: 'AVAILABLE' },
      ],
    }),

    // ============= Customer =============
    getCustomerList: builder.query<PagedResultDto<CustomerDto>, PagedAndSortedResultRequestDto>({
      query: (params) => ({
        url: CUSTOMER_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'Customer', id: 'LIST' }],
    }),
    getCustomer: builder.query<CustomerDto, string>({
      query: (id) => `${CUSTOMER_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Customer', id }],
    }),
    getActiveCustomers: builder.query<PagedResultDto<CustomerDto>, void>({
      query: () => `${CUSTOMER_URL}/active`,
      transformResponse: (response: CustomerDto[]) => ({
        items: response,
        totalCount: response.length,
      }),
      providesTags: [{ type: 'Customer', id: 'ACTIVE' }],
    }),
    createCustomer: builder.mutation<CustomerDto, CreateUpdateCustomerDto>({
      query: (data) => ({
        url: CUSTOMER_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }, { type: 'Customer', id: 'ACTIVE' }],
    }),
    updateCustomer: builder.mutation<CustomerDto, { id: string; data: CreateUpdateCustomerDto }>({
      query: ({ id, data }) => ({
        url: `${CUSTOMER_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
        { type: 'Customer', id: 'ACTIVE' },
      ],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `${CUSTOMER_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }, { type: 'Customer', id: 'ACTIVE' }],
    }),

    // ============= Laboratory =============
    getLaboratoryList: builder.query<LaboratoryDto[], void>({
      query: () => LABORATORY_URL,
      transformResponse: (response: LaboratoryDto[] | { items: LaboratoryDto[] }) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.items || [];
      },
      providesTags: [{ type: 'Laboratory', id: 'LIST' }],
    }),
    getLaboratory: builder.query<LaboratoryDto, string>({
      query: (id) => `${LABORATORY_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Laboratory', id }],
    }),
    getActiveLaboratories: builder.query<LaboratoryDto[], void>({
      query: () => `${LABORATORY_URL}/active`,
      transformResponse: (response: LaboratoryDto[] | { items: LaboratoryDto[] }) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.items || [];
      },
      providesTags: [{ type: 'Laboratory', id: 'ACTIVE' }],
    }),
    createLaboratory: builder.mutation<LaboratoryDto, CreateUpdateLaboratoryDto>({
      query: (data) => ({
        url: LABORATORY_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Laboratory', id: 'LIST' }, { type: 'Laboratory', id: 'ACTIVE' }],
    }),
    updateLaboratory: builder.mutation<LaboratoryDto, { id: string; data: CreateUpdateLaboratoryDto }>({
      query: ({ id, data }) => ({
        url: `${LABORATORY_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Laboratory', id },
        { type: 'Laboratory', id: 'LIST' },
        { type: 'Laboratory', id: 'ACTIVE' },
      ],
    }),
    deleteLaboratory: builder.mutation<void, string>({
      query: (id) => ({
        url: `${LABORATORY_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Laboratory', id: 'LIST' }, { type: 'Laboratory', id: 'ACTIVE' }],
    }),

    // ============= IndicatorGroup =============
    getIndicatorGroupList: builder.query<PagedResultDto<IndicatorGroupDto>, PagedAndSortedResultRequestDto>({
      query: (params) => ({
        url: INDICATOR_GROUP_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'IndicatorGroup', id: 'LIST' }],
    }),
    getIndicatorGroup: builder.query<IndicatorGroupDto, string>({
      query: (id) => `${INDICATOR_GROUP_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'IndicatorGroup', id }],
    }),
    getActiveIndicatorGroups: builder.query<IndicatorGroupDto[], void>({
      query: () => `${INDICATOR_GROUP_URL}/active`,
      providesTags: [{ type: 'IndicatorGroup', id: 'ACTIVE' }],
    }),
    getIndicatorGroupsWithCount: builder.query<IndicatorGroupDto[], void>({
      query: () => `${INDICATOR_GROUP_URL}/with-count`,
      providesTags: [{ type: 'IndicatorGroup', id: 'WITH_COUNT' }],
    }),
    createIndicatorGroup: builder.mutation<IndicatorGroupDto, CreateUpdateIndicatorGroupDto>({
      query: (data) => ({
        url: INDICATOR_GROUP_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'IndicatorGroup', id: 'LIST' },
        { type: 'IndicatorGroup', id: 'ACTIVE' },
        { type: 'IndicatorGroup', id: 'WITH_COUNT' },
      ],
    }),
    updateIndicatorGroup: builder.mutation<IndicatorGroupDto, { id: string; data: CreateUpdateIndicatorGroupDto }>({
      query: ({ id, data }) => ({
        url: `${INDICATOR_GROUP_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'IndicatorGroup', id },
        { type: 'IndicatorGroup', id: 'LIST' },
        { type: 'IndicatorGroup', id: 'ACTIVE' },
        { type: 'IndicatorGroup', id: 'WITH_COUNT' },
      ],
    }),
    deleteIndicatorGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `${INDICATOR_GROUP_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'IndicatorGroup', id: 'LIST' },
        { type: 'IndicatorGroup', id: 'ACTIVE' },
        { type: 'IndicatorGroup', id: 'WITH_COUNT' },
      ],
    }),

    // ============= Indicator =============
    getIndicatorList: builder.query<PagedResultDto<IndicatorDto>, IndicatorFilterDto>({
      query: (params) => ({
        url: INDICATOR_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'Indicator', id: 'LIST' }],
    }),
    getIndicator: builder.query<IndicatorDto, string>({
      query: (id) => `${INDICATOR_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Indicator', id }],
    }),
    getActiveIndicators: builder.query<IndicatorDto[], void>({
      query: () => `${INDICATOR_URL}/active`,
      providesTags: [{ type: 'Indicator', id: 'ACTIVE' }],
    }),
    getIndicatorsByGroup: builder.query<IndicatorDto[], string>({
      query: (groupId) => `${INDICATOR_URL}/by-group/${groupId}`,
      providesTags: (_, __, groupId) => [{ type: 'Indicator', id: `GROUP_${groupId}` }],
    }),
    createIndicator: builder.mutation<IndicatorDto, CreateIndicatorDto>({
      query: (data) => ({
        url: INDICATOR_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Indicator', id: 'LIST' },
        { type: 'Indicator', id: 'ACTIVE' },
        { type: 'IndicatorGroup', id: 'WITH_COUNT' },
      ],
    }),
    updateIndicator: builder.mutation<IndicatorDto, { id: string; data: UpdateIndicatorDto }>({
      query: ({ id, data }) => ({
        url: `${INDICATOR_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Indicator', id },
        { type: 'Indicator', id: 'LIST' },
        { type: 'Indicator', id: 'ACTIVE' },
      ],
    }),
    deleteIndicator: builder.mutation<void, string>({
      query: (id) => ({
        url: `${INDICATOR_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Indicator', id: 'LIST' },
        { type: 'Indicator', id: 'ACTIVE' },
        { type: 'IndicatorGroup', id: 'WITH_COUNT' },
      ],
    }),
    toggleIndicatorActive: builder.mutation<IndicatorDto, string>({
      query: (id) => ({
        url: `${INDICATOR_URL}/${id}/toggle-active`,
        method: 'PUT',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Indicator', id },
        { type: 'Indicator', id: 'LIST' },
        { type: 'Indicator', id: 'ACTIVE' },
      ],
    }),
    canDeleteIndicator: builder.query<boolean, string>({
      query: (id) => `${INDICATOR_URL}/can-delete/${id}`,
    }),
    createBulkIndicators: builder.mutation<IndicatorDto[], CreateBulkIndicatorsDto>({
      query: (data) => ({
        url: `${INDICATOR_URL}/bulk`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Indicator', id: 'LIST' },
        { type: 'Indicator', id: 'ACTIVE' },
        { type: 'IndicatorGroup', id: 'WITH_COUNT' },
      ],
    }),

    // ============= FormTemplate =============
    getFormTemplateList: builder.query<FormTemplateDto[], void>({
      query: () => FORM_TEMPLATE_URL,
      providesTags: [{ type: 'FormTemplate', id: 'LIST' }],
    }),

    // ============= Statistics =============
    getMasterDataStatistics: builder.query<MasterDataStatisticsDto, void>({
      query: () => MASTER_DATA_STATISTICS_URL,
      providesTags: [{ type: 'MasterDataStatistics', id: 'ALL' }],
    }),
  }),
});

// Export hooks
export const {
  // Department
  useGetDepartmentListQuery,
  useLazyGetDepartmentListQuery,
  useGetDepartmentQuery,
  useGetActiveDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  // SpecimenType
  useGetSpecimenTypeListQuery,
  useLazyGetSpecimenTypeListQuery,
  useGetSpecimenTypeQuery,
  useGetActiveSpecimenTypesQuery,
  useCreateSpecimenTypeMutation,
  useUpdateSpecimenTypeMutation,
  useDeleteSpecimenTypeMutation,
  // TestMethod
  useGetTestMethodListQuery,
  useLazyGetTestMethodListQuery,
  useGetTestMethodQuery,
  useGetActiveTestMethodsQuery,
  useCreateTestMethodMutation,
  useUpdateTestMethodMutation,
  useDeleteTestMethodMutation,
  // StorageLocation
  useGetStorageLocationListQuery,
  useLazyGetStorageLocationListQuery,
  useGetStorageLocationQuery,
  useGetActiveStorageLocationsQuery,
  useGetAvailableStorageLocationsQuery,
  useCreateStorageLocationMutation,
  useUpdateStorageLocationMutation,
  useDeleteStorageLocationMutation,
  // Customer
  useGetCustomerListQuery,
  useLazyGetCustomerListQuery,
  useGetCustomerQuery,
  useGetActiveCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  // Laboratory
  useGetLaboratoryListQuery,
  useLazyGetLaboratoryListQuery,
  useGetLaboratoryQuery,
  useGetActiveLaboratoriesQuery,
  useCreateLaboratoryMutation,
  useUpdateLaboratoryMutation,
  useDeleteLaboratoryMutation,
  // IndicatorGroup
  useGetIndicatorGroupListQuery,
  useLazyGetIndicatorGroupListQuery,
  useGetIndicatorGroupQuery,
  useGetActiveIndicatorGroupsQuery,
  useGetIndicatorGroupsWithCountQuery,
  useCreateIndicatorGroupMutation,
  useUpdateIndicatorGroupMutation,
  useDeleteIndicatorGroupMutation,
  // Indicator
  useGetIndicatorListQuery,
  useLazyGetIndicatorListQuery,
  useGetIndicatorQuery,
  useGetActiveIndicatorsQuery,
  useGetIndicatorsByGroupQuery,
  useCreateIndicatorMutation,
  useUpdateIndicatorMutation,
  useDeleteIndicatorMutation,
  useToggleIndicatorActiveMutation,
  useCanDeleteIndicatorQuery,
  useCreateBulkIndicatorsMutation,
  // FormTemplate
  useGetFormTemplateListQuery,
  // Statistics
  useGetMasterDataStatisticsQuery,
} = masterDataApi;

export default masterDataApi;
