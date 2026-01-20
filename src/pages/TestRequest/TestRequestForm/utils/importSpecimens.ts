/**
 * Utilities for importing specimens from Excel in TestRequestForm
 */
import * as XLSX from 'xlsx';
import {
  SpecimenExcelRow,
  SpecimenImportPreviewResult,
  SpecimenImportPreviewItem,
  SpecimenIndicatorImportItem,
  ImportRowError
} from '../types/importTypes';
import {
  SampleFormData,
  IndicatorMethodInfo,
  createIndicatorMethodKey
} from '../types';
import { SampleStatus } from '../../../../types/testRequest';
import { IndicatorDto } from '../../../../services/masterDataService';

/**
 * Parse Excel file và validate data
 * @param fileBuffer ArrayBuffer của file Excel
 * @param indicators Danh sách indicators từ master data
 * @param indicatorMethodsMap Map từ indicatorId -> list of IndicatorMethodInfo
 */
export function parseAndValidateSpecimenExcel(
  fileBuffer: ArrayBuffer,
  indicators: IndicatorDto[],
  indicatorMethodsMap: Record<string, IndicatorMethodInfo[]>
): SpecimenImportPreviewResult {
  // Read Excel
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: SpecimenExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  // Create indicator lookup map (name.toLowerCase() -> indicator)
  const indicatorMap = new Map<string, IndicatorDto>();
  indicators.forEach(ind => {
    indicatorMap.set(ind.name.trim().toLowerCase(), ind);
  });

  const errors: ImportRowError[] = [];
  const specimenMap = new Map<string, SpecimenImportPreviewItem>();

  // Process each row
  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // Excel row (1-indexed + header)
    const sampleName = row["Tên mẫu"]?.toString().trim();
    const indicatorName = row["Chỉ tiêu kiểm nghiệm"]?.toString().trim();

    // Validate required fields
    if (!sampleName) {
      errors.push({
        rowNumber,
        columnName: "Tên mẫu",
        errorMessage: "Tên mẫu là bắt buộc",
        value: sampleName
      });
      return;
    }

    if (!indicatorName) {
      errors.push({
        rowNumber,
        columnName: "Chỉ tiêu kiểm nghiệm",
        errorMessage: "Chỉ tiêu kiểm nghiệm là bắt buộc",
        value: indicatorName
      });
      return;
    }

    // Find indicator in master data
    const indicator = indicatorMap.get(indicatorName.toLowerCase());
    if (!indicator) {
      errors.push({
        rowNumber,
        columnName: "Chỉ tiêu kiểm nghiệm",
        errorMessage: `Chỉ tiêu "${indicatorName}" không tồn tại trong hệ thống`,
        value: indicatorName
      });
    }

    // Get or create specimen
    const specimenKey = sampleName.toLowerCase();
    if (!specimenMap.has(specimenKey)) {
      specimenMap.set(specimenKey, {
        sampleName: sampleName,
        specimenTypeName: row["Loại mẫu"]?.toString().trim(),
        samplingAddress: row["Địa chỉ lấy mẫu"]?.toString().trim(),
        sampleQuantity: row["Lượng mẫu"]?.toString().trim(),
        statusText: row["Tình trạng mẫu"]?.toString().trim(),
        indicators: [],
        isValid: true,
        errors: []
      });
    }

    const specimen = specimenMap.get(specimenKey)!;

    // Check duplicate indicator in same specimen
    const existingIndicator = specimen.indicators.find(
      i => i.indicatorName.toLowerCase() === indicatorName.toLowerCase()
    );
    if (existingIndicator) {
      errors.push({
        rowNumber,
        columnName: "Chỉ tiêu kiểm nghiệm",
        errorMessage: `Chỉ tiêu "${indicatorName}" bị trùng trong mẫu "${sampleName}"`,
        value: indicatorName
      });
    }

    // Get test method for indicator
    let testMethodId: string | undefined;
    let testMethodName: string | undefined;
    if (indicator) {
      const methods = indicatorMethodsMap[indicator.id] || [];
      // Get first active method as default
      const activeMethod = methods.find(m => m.isActive) || methods[0];
      if (activeMethod) {
        testMethodId = activeMethod.testMethodId;
        testMethodName = activeMethod.testMethodName;
      }
    }

    // Add indicator to specimen
    const indicatorItem: SpecimenIndicatorImportItem = {
      rowNumber,
      indicatorName,
      indicatorId: indicator?.id,
      testMethodId,
      testMethodName,
      isValid: !!indicator,
      errorMessage: indicator ? undefined : `Chỉ tiêu không tồn tại`
    };
    specimen.indicators.push(indicatorItem);

    // Update specimen validity
    if (!indicator) {
      specimen.isValid = false;
      specimen.errors.push(`Chỉ tiêu "${indicatorName}" không tồn tại`);
    }
  });

  const specimens = Array.from(specimenMap.values());
  const validSpecimens = specimens.filter(s => s.isValid).length;

  return {
    isValid: errors.length === 0,
    totalRows: rows.length,
    totalSpecimens: specimens.length,
    totalIndicators: specimens.reduce((sum, s) => sum + s.indicators.length, 0),
    validSpecimens,
    specimens,
    errors
  };
}

/**
 * Convert preview items to SampleFormData for merging into form state
 * @param previewItems Danh sách specimens đã validate
 * @param existingSamplesCount Số lượng samples hiện có trong form
 * @param sampleCodePrefix Prefix cho mã mẫu (contract number)
 */
export function convertToSampleFormData(
  previewItems: SpecimenImportPreviewItem[],
  existingSamplesCount: number,
  sampleCodePrefix: string
): SampleFormData[] {
  return previewItems
    .filter(item => item.isValid)
    .map((item, idx) => {
      const sortOrder = existingSamplesCount + idx + 1;
      // Format: prefix + 2-digit order number (e.g., "2024-001-01")
      const sampleCode = `${sampleCodePrefix}${String(sortOrder).padStart(2, '0')}`;

      // Convert indicators to IndicatorMethodKey format
      const indicatorMethods = item.indicators
        .filter(ind => ind.indicatorId && ind.testMethodId)
        .map(ind => createIndicatorMethodKey(ind.indicatorId!, ind.testMethodId!));

      return {
        key: `import_${Date.now()}_${idx}`,
        sortOrder,
        sampleCode,
        sampleName: item.sampleName,
        specimenTypeName: item.specimenTypeName,
        samplingAddress: item.samplingAddress,
        sampleQuantity: item.sampleQuantity,
        status: SampleStatus.Pending,
        statusText: item.statusText,
        indicatorIds: [], // deprecated
        indicatorMethods,
        attachments: [],
        isSharedSample: false
      } as SampleFormData;
    });
}
