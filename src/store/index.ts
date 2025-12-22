import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import API slices
import { authApi } from './api/authApi';
import { auditLogApi } from './api/auditLogApi';
import { dashboardApi } from './api/dashboardApi';
import { employeeApi } from './api/employeeApi';
import { laboratoryTaskApi } from './api/laboratoryTaskApi';
import { masterDataApi } from './api/masterDataApi';
import { ncrApi } from './api/ncrApi';
import { organizationApi } from './api/organizationApi';
import { reportApi } from './api/reportApi';
import { settingsApi } from './api/settingsApi';
import { specimenApi } from './api/specimenApi';
import { specimenHistoryApi } from './api/specimenHistoryApi';
import { statisticsApi } from './api/statisticsApi';
import { testApi } from './api/testApi';
import { testRequestApi } from './api/testRequestApi';
import { testResultApi } from './api/testResultApi';
import { testingApi } from './api/testingApi';
import { userApi } from './api/userApi';
import { subcontractorApi } from './api/subcontractorApi';

export const store = configureStore({
  reducer: {
    // RTK Query reducers
    [authApi.reducerPath]: authApi.reducer,
    [auditLogApi.reducerPath]: auditLogApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [laboratoryTaskApi.reducerPath]: laboratoryTaskApi.reducer,
    [masterDataApi.reducerPath]: masterDataApi.reducer,
    [ncrApi.reducerPath]: ncrApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [specimenApi.reducerPath]: specimenApi.reducer,
    [specimenHistoryApi.reducerPath]: specimenHistoryApi.reducer,
    [statisticsApi.reducerPath]: statisticsApi.reducer,
    [testApi.reducerPath]: testApi.reducer,
    [testRequestApi.reducerPath]: testRequestApi.reducer,
    [testResultApi.reducerPath]: testResultApi.reducer,
    [testingApi.reducerPath]: testingApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [subcontractorApi.reducerPath]: subcontractorApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(auditLogApi.middleware)
      .concat(dashboardApi.middleware)
      .concat(employeeApi.middleware)
      .concat(laboratoryTaskApi.middleware)
      .concat(masterDataApi.middleware)
      .concat(ncrApi.middleware)
      .concat(organizationApi.middleware)
      .concat(reportApi.middleware)
      .concat(settingsApi.middleware)
      .concat(specimenApi.middleware)
      .concat(specimenHistoryApi.middleware)
      .concat(statisticsApi.middleware)
      .concat(testApi.middleware)
      .concat(testRequestApi.middleware)
      .concat(testResultApi.middleware)
      .concat(testingApi.middleware)
      .concat(userApi.middleware)
      .concat(subcontractorApi.middleware),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
