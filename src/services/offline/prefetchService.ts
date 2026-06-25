/**
 * Prefetch Service - Proactively fetches and caches data for offline use
 *
 * This service should be called when the app initializes (while online)
 * to ensure data is available for offline use.
 */

import {
  indicatorGroupService,
  indicatorService,
  storageLocationService,
  laboratoryService,
  testMethodService,
  specimenTypeService,
  sampleConditionService,
  sampleTypeCategoryService,
  formTemplateService,
} from '../masterDataService';
import { userService } from '../userService';
import { organizationService } from '../organizationService';
import { cacheEntity, cacheDocumentTemplate, getDB } from './db';
import { TEMPLATE_NAMES, TEMPLATE_FILE_NAMES } from './offlinePrintService';

// Track prefetch status
let isPrefetching = false;
let lastPrefetchTime: Date | null = null;
const PREFETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes

/**
 * Prefetch all master data needed for TestRequest forms
 * Should be called on app initialization when online
 */
export async function prefetchMasterData(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Prefetch skipped: offline');
    return;
  }

  if (isPrefetching) {
    console.log('Prefetch already in progress');
    return;
  }

  // Skip if recently prefetched
  if (lastPrefetchTime && Date.now() - lastPrefetchTime.getTime() < PREFETCH_INTERVAL) {
    console.log('Prefetch skipped: recently prefetched');
    return;
  }

  isPrefetching = true;
  console.log('Starting master data prefetch...');

  try {
    // Prefetch all data in parallel
    const results = await Promise.allSettled([
      prefetchIndicatorGroups(),
      prefetchIndicators(),
      prefetchStorageLocations(),
      prefetchLaboratories(),
      prefetchTestMethods(),
      prefetchSpecimenTypes(),
      prefetchSpecimenTypesWithIndicators(),
      prefetchSampleConditions(),
      prefetchSampleTypeCategories(),
      prefetchUsers(),
      prefetchOrganizations(),
      prefetchDocumentTemplates(),
    ]);

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`Prefetch completed: ${successful} successful, ${failed} failed`);

    lastPrefetchTime = new Date();

    // Save prefetch timestamp
    const db = await getDB();
    await db.put('syncMetadata', {
      key: 'lastPrefetchTime',
      value: lastPrefetchTime.toISOString(),
    });
  } catch (error) {
    console.error('Prefetch failed:', error);
  } finally {
    isPrefetching = false;
  }
}

async function prefetchIndicatorGroups(): Promise<void> {
  try {
    const data = await indicatorGroupService.getActive();
    for (const item of data) {
      await cacheEntity('IndicatorGroup', item.id, item, false);
    }
    console.log(`Cached ${data.length} indicator groups`);
  } catch (error) {
    console.error('Failed to prefetch indicator groups:', error);
    throw error;
  }
}

async function prefetchIndicators(): Promise<void> {
  try {
    const data = await indicatorService.getActive();
    for (const item of data) {
      await cacheEntity('StandardIndicator', item.id, item, false);
    }
    console.log(`Cached ${data.length} indicators`);
  } catch (error) {
    console.error('Failed to prefetch indicators:', error);
    throw error;
  }
}

async function prefetchStorageLocations(): Promise<void> {
  try {
    const data = await storageLocationService.getActive();
    for (const item of data.items) {
      // Use 'Receipt' type with 'StorageLocation:' prefix to distinguish from actual receipts
      await cacheEntity('Receipt', `StorageLocation:${item.id}`, item, false);
    }
    console.log(`Cached ${data.items.length} storage locations`);
  } catch (error) {
    console.error('Failed to prefetch storage locations:', error);
    throw error;
  }
}

async function prefetchLaboratories(): Promise<void> {
  try {
    const data = await laboratoryService.getActive();
    for (const item of data) {
      await cacheEntity('Laboratory', item.id, item, false);
    }
    console.log(`Cached ${data.length} laboratories`);
  } catch (error) {
    console.error('Failed to prefetch laboratories:', error);
    throw error;
  }
}

async function prefetchTestMethods(): Promise<void> {
  try {
    const data = await testMethodService.getWithIndicators();
    for (const item of data) {
      await cacheEntity('TestMethod', item.id, item, false);
    }
    console.log(`Cached ${data.length} test methods`);
  } catch (error) {
    console.error('Failed to prefetch test methods:', error);
    throw error;
  }
}

async function prefetchSpecimenTypes(): Promise<void> {
  try {
    const data = await specimenTypeService.getActive();
    for (const item of data.items) {
      await cacheEntity('SpecimenType', item.id, item, false);
    }
    console.log(`Cached ${data.items.length} specimen types`);
  } catch (error) {
    console.error('Failed to prefetch specimen types:', error);
    throw error;
  }
}

async function prefetchSpecimenTypesWithIndicators(): Promise<void> {
  try {
    const data = await specimenTypeService.getWithIndicators();
    for (const item of data) {
      await cacheEntity('SpecimenType', `WithIndicators:${item.id}`, item, false);
    }
    console.log(`Cached ${data.length} specimen types with indicators`);
  } catch (error) {
    console.error('Failed to prefetch specimen types with indicators:', error);
    throw error;
  }
}

async function prefetchSampleConditions(): Promise<void> {
  try {
    const data = await sampleConditionService.getActive();
    for (const item of data) {
      await cacheEntity('Testing', `SampleCondition:${item.id}`, item, false);
    }
    console.log(`Cached ${data.length} sample conditions`);
  } catch (error) {
    console.error('Failed to prefetch sample conditions:', error);
    throw error;
  }
}

async function prefetchSampleTypeCategories(): Promise<void> {
  try {
    const data = await sampleTypeCategoryService.getActive();
    for (const item of data) {
      await cacheEntity('Testing', `SampleTypeCategory:${item.id}`, item, false);
    }
    console.log(`Cached ${data.length} sample type categories`);
  } catch (error) {
    console.error('Failed to prefetch sample type categories:', error);
    throw error;
  }
}

async function prefetchUsers(): Promise<void> {
  try {
    const data = await userService.getLookup();
    for (const item of data) {
      await cacheEntity('Employee', `User:${item.id}`, item, false);
    }
    console.log(`Cached ${data.length} users`);
  } catch (error) {
    console.error('Failed to prefetch users:', error);
    throw error;
  }
}

async function prefetchOrganizations(): Promise<void> {
  try {
    const data = await organizationService.getAllActive();
    for (const item of data) {
      await cacheEntity('Subcontractor', `Organization:${item.id}`, item, false);
    }
    console.log(`Cached ${data.length} organizations`);
  } catch (error) {
    console.error('Failed to prefetch organizations:', error);
    throw error;
  }
}

/**
 * Prefetch document templates for offline printing
 */
async function prefetchDocumentTemplates(): Promise<void> {
  try {
    // Always re-download (this whole prefetch cycle is already throttled to
    // once per PREFETCH_INTERVAL) so a template edited on the backend isn't
    // stuck forever behind a stale IndexedDB copy.
    const templateFileName = TEMPLATE_FILE_NAMES[TEMPLATE_NAMES.TEST_REQUEST_FORM];
    const templateBlob = await formTemplateService.download(templateFileName);

    // Cache the template
    await cacheDocumentTemplate(
      TEMPLATE_NAMES.TEST_REQUEST_FORM,
      templateFileName,
      templateBlob,
      new Date().toISOString() // Simple version tracking
    );

    console.log('Cached test request form template for offline printing');
  } catch (error) {
    console.error('Failed to prefetch document templates:', error);
    throw error;
  }

  // Result-form templates (BM01-QT13 ...) for offline result generation.
  // Cached separately so a failure here does not block the request-form template.
  try {
    const resultTemplateName = TEMPLATE_NAMES.RESULT_FORM_BM01;
    const fileName = TEMPLATE_FILE_NAMES[resultTemplateName];
    const blob = await formTemplateService.download(fileName);
    await cacheDocumentTemplate(
      resultTemplateName,
      fileName,
      blob,
      new Date().toISOString()
    );
    console.log('Cached BM01 result-form template for offline generation');
  } catch (error) {
    // Non-fatal: result-form offline generation just stays unavailable.
    console.error('Failed to prefetch result-form template:', error);
  }
}

/**
 * Check if prefetch has been done
 */
export async function hasPrefetchedData(): Promise<boolean> {
  try {
    const db = await getDB();
    const metadata = await db.get('syncMetadata', 'lastPrefetchTime');
    return !!metadata;
  } catch {
    return false;
  }
}

/**
 * Get last prefetch time
 */
export async function getLastPrefetchTime(): Promise<Date | null> {
  try {
    const db = await getDB();
    const metadata = await db.get('syncMetadata', 'lastPrefetchTime');
    return metadata ? new Date(metadata.value as string) : null;
  } catch {
    return null;
  }
}

/**
 * Force prefetch (ignore time check)
 */
export async function forcePrefetch(): Promise<void> {
  lastPrefetchTime = null;
  await prefetchMasterData();
}

// Auto-prefetch when online status changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored, triggering prefetch...');
    prefetchMasterData();
  });
}
