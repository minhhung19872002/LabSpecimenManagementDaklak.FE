/**
 * Offline Print Service
 *
 * Handles client-side generation of .docx documents for offline printing.
 * Uses docxtemplater + pizzip to fill templates with TestRequest data.
 */

import { saveAs } from 'file-saver';
import {
  getCachedDocumentTemplate,
  getCachedTestRequest,
  getCachedEntity,
  hasDocumentTemplate,
} from './db';
import {
  TestRequestDto,
  SamplingRequirement,
  SampleStorageOption,
  ResultLanguage,
} from '../../types/testRequest';
import { numberToVietnameseWords } from '../../utils/numberToWords';
import { fillDocxTemplate } from './docxFill';
import { prepareResultTemplate } from './resultTemplatePrep';
import { prepareRequestTemplate } from './requestTemplatePrep';
import { buildRequestSampleRows } from './requestFormBuilder';
import {
  buildResultFormData,
  ResultFormHeader,
  ResultIndicatorInput,
} from './resultFormBuilder';
import dayjs from 'dayjs';

// Template name constants
export const TEMPLATE_NAMES = {
  TEST_REQUEST_FORM: 'test-request-form', // BM01-QT07 - Phieu yeu cau
  RESULT_FORM_BM01: 'result-form-bm01', // BM01-QT13 - Phieu tra ket qua (single sample)
} as const;

// Backend template file name (must match what's downloaded during prefetch)
export const TEMPLATE_FILE_NAMES = {
  [TEMPLATE_NAMES.TEST_REQUEST_FORM]:
    'BM01-QT07- XXYCĐNHĐ_3.2 phieu yeu cau.template.docx',
  [TEMPLATE_NAMES.RESULT_FORM_BM01]:
    'Form trả KQ - BM01-QT13-BCKQ_3.2.template.docx',
};

// Checkbox characters matching backend TemplateConstants
const CHECKED_BOX = '☑';
const UNCHECKED_BOX = '☐';

export interface OfflinePrintResult {
  success: boolean;
  fileName?: string;
  blob?: Blob;
  error?: string;
}

export interface OfflinePrintStatus {
  available: boolean;
  reason?: 'template_missing' | 'data_missing' | 'ready';
  message?: string;
}

/**
 * Generate Test Request form document offline
 */
export async function generateTestRequestFormOffline(
  testRequestId: string
): Promise<OfflinePrintResult> {
  try {
    // 1. Get cached template
    const template = await getCachedDocumentTemplate(
      TEMPLATE_NAMES.TEST_REQUEST_FORM
    );
    if (!template) {
      return {
        success: false,
        error:
          'Template chưa được tải về. Vui lòng kết nối mạng để tải template.',
      };
    }

    // 2. Get cached TestRequest data - try both stores
    let testRequest: TestRequestDto | null = null;

    // First try the legacy testRequests store
    const cachedLegacy = await getCachedTestRequest(testRequestId);
    if (cachedLegacy) {
      testRequest = cachedLegacy.data as TestRequestDto;
    } else {
      // Fall back to entityCache store
      const cachedEntity = await getCachedEntity('TestRequest', testRequestId);
      if (cachedEntity) {
        testRequest = cachedEntity.data as TestRequestDto;
      }
    }

    if (!testRequest) {
      return {
        success: false,
        error: 'Không tìm thấy dữ liệu phiếu yêu cầu trong bộ nhớ đệm.',
      };
    }

    // 3. Build placeholder data (scalars + flat sample-table rows)
    const placeholderData = buildTestRequestPlaceholders(testRequest);
    const rows = buildRequestSampleRows(testRequest.samples);

    // 4. Generate document: prepare template (flat loop) then fill
    const prepared = await prepareRequestTemplate(template.blob);
    const { blob: generatedBlob } = await fillDocxTemplate(prepared.blob, {
      ...placeholderData,
      rows,
    });

    // 5. Build file name
    const fileName = `PhieuYeuCau_${
      testRequest.contractNumber || testRequest.requestNumber || 'OFFLINE'
    }_${dayjs().format('YYYYMMDDHHmmss')}.docx`;

    return {
      success: true,
      fileName,
      blob: generatedBlob,
    };
  } catch (error) {
    console.error('[OfflinePrint] Error generating document:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Lỗi không xác định khi tạo tài liệu.',
    };
  }
}

/**
 * Generate a BM01 result form offline from cached template + provided data.
 *
 * `header` carries the scalar fields (sample, customer, dates...) and
 * `indicators` is the flat list (parent/child) used to build the result table.
 * The result data itself comes from the offline entry form / cache — this
 * function only assembles + fills the document.
 */
export async function generateResultFormOffline(
  header: ResultFormHeader,
  indicators: ResultIndicatorInput[]
): Promise<OfflinePrintResult> {
  try {
    const template = await getCachedDocumentTemplate(TEMPLATE_NAMES.RESULT_FORM_BM01);
    if (!template) {
      return {
        success: false,
        error:
          'Template phiếu kết quả chưa được tải về. Vui lòng kết nối mạng để tải template.',
      };
    }

    // Canonical template -> loop + raw-xml template, then fill.
    const prepared = await prepareResultTemplate(template.blob);
    const data = buildResultFormData(header, indicators);
    const { blob } = await fillDocxTemplate(prepared.blob, data);

    const fileName = `KetQua_${header.SampleCode || 'OFFLINE'}_${dayjs().format(
      'YYYYMMDDHHmmss'
    )}.docx`;
    return { success: true, fileName, blob };
  } catch (error) {
    console.error('[OfflinePrint] Error generating result form:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Lỗi không xác định khi tạo phiếu kết quả.',
    };
  }
}

/**
 * Download the generated document
 */
export function downloadDocument(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}

/**
 * Check if offline printing is available (template cached)
 */
export async function isOfflinePrintAvailable(): Promise<boolean> {
  return hasDocumentTemplate(TEMPLATE_NAMES.TEST_REQUEST_FORM);
}

/**
 * Get detailed offline print status
 */
export async function getOfflinePrintStatus(
  testRequestId: string
): Promise<OfflinePrintStatus> {
  // Check template
  const templateExists = await hasDocumentTemplate(
    TEMPLATE_NAMES.TEST_REQUEST_FORM
  );
  if (!templateExists) {
    return {
      available: false,
      reason: 'template_missing',
      message:
        'Template phiếu yêu cầu chưa được tải về. Kết nối mạng để tải template.',
    };
  }

  // Check data - try both stores
  const cachedLegacy = await getCachedTestRequest(testRequestId);
  const cachedEntity = await getCachedEntity('TestRequest', testRequestId);

  if (!cachedLegacy && !cachedEntity) {
    return {
      available: false,
      reason: 'data_missing',
      message: 'Dữ liệu phiếu yêu cầu chưa được lưu trữ offline.',
    };
  }

  return {
    available: true,
    reason: 'ready',
    message: 'Sẵn sàng in offline.',
  };
}


/**
 * Get checkbox character based on boolean value
 */
function checkbox(checked: boolean): string {
  return checked ? CHECKED_BOX : UNCHECKED_BOX;
}

/**
 * Format date to Vietnamese format DD/MM/YYYY
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return dayjs(dateStr).format('DD/MM/YYYY');
}

/**
 * Build placeholder data from TestRequest
 * Uses the exact same placeholder names as the backend
 */
function buildTestRequestPlaceholders(
  data: TestRequestDto
): Record<string, string> {
  const address = data.address || '';
  const wardText = data.ward || '';
  const districtText = data.district || '';
  const provinceText = data.province || '';
  const resultCopies = data.resultCopyCount || '';
  // Only show CustomerTestMethod when MethodCustomer = true
  const customerTestMethod = data.methodCustomer
    ? data.methodCustomerDetail || ''
    : '';
  const compareStandard = data.conformityDeclaration || '';
  const otherRequirements = data.otherRequirements || '';
  const subContractInfo = data.subContract || '';
  const currentDate = dayjs().format('DD/MM/YYYY');
  const dateReceiving = formatDate(data.resultDeliveryDate);

  // Mẫu nhiệm vụ hiển thị 0
  const actualTotalCost = data.sampleTypeTask ? 0 : data.totalCost || 0;
  const totalAmount = actualTotalCost.toLocaleString('vi-VN');
  const totalByText = data.sampleTypeTask
    ? 'Không đồng'
    : data.totalCostInWords || numberToVietnameseWords(data.totalCost || 0);
  const receiptNumber = data.receiptNumber || '';

  // Build sample table string (simplified version)
  // Note: Full table replacement requires more complex template handling
  // For now, we provide a summary
  const sampleCount = data.samples?.length || data.totalSampleCount || 0;

  return {
    // Basic info
    ContractNo: data.contractNumber || '',
    Customer: data.customerName || '',
    Adress: address, // Note: backend uses both "Adress" and "Address"
    Address: address,
    Ward: wardText,
    District: districtText,
    Province: provinceText,
    TaxNo: data.taxCode || '',
    ContactPerson: data.contactPerson || '',
    PhoneNumber: data.phone || '',
    SampleTotal: sampleCount.toString(),
    ResultCopies: resultCopies,
    CertifiedCopies: resultCopies,
    CustomerTestMethod: customerTestMethod,
    CompareStandard: compareStandard,
    OtherRequirements: otherRequirements,
    SubContractInfo: subContractInfo,
    DateReceiving: dateReceiving,
    TotalAmount: totalAmount,
    TotalByText: totalByText,
    ReceiptNumberTTDV: receiptNumber,
    CurrentDate: currentDate,
    // The "Số HĐ / Ngày" textbox in the canonical template uses this tag.
    FormPrintedDate: currentDate,

    // Checkbox - Test Method
    CB_TestMethod_Center: checkbox(data.methodWestHighlandInstitute),
    CB_TestMethod_Customer: checkbox(data.methodCustomer),

    // Checkbox - Report Language
    CB_Report_VN: checkbox(data.resultLanguage === ResultLanguage.Vietnamese),
    CB_Report_EN: checkbox(data.resultLanguage === ResultLanguage.English),
    CB_Report_Both: checkbox(
      data.resultLanguage === ResultLanguage.VietnameseAndEnglish
    ),

    // Checkbox - Separate Results
    CB_SeparateResult: checkbox(data.separatePassedResults),

    // Checkbox - Sampling Requirement
    CB_Sampling_Center: checkbox(
      data.samplingRequirement === SamplingRequirement.LabSampling
    ),
    CB_Sampling_Customer: checkbox(
      data.samplingRequirement === SamplingRequirement.CustomerSampling
    ),

    // Checkbox - Delivery Method
    CB_Delivery_Direct: checkbox(data.deliveryDirectPickup),
    CB_Delivery_Post: checkbox(data.deliveryPostal),

    // Checkbox - Return Sample
    CB_ReturnSample: checkbox(data.returnStoredSample),

    // Checkbox - Agree Terms
    CB_AgreeTerms: checkbox(data.agreeTerms),

    // Checkbox - Sample Type
    CB_Service: checkbox(data.sampleTypeService),
    CB_Contract: checkbox(data.sampleTypeContract),
    CB_QLNN: checkbox(data.sampleTypeTask),
    CB_SubContract: checkbox(data.sampleTypeSubContract),

    // Checkbox - Sample Storage
    CB_Save_No: checkbox(data.sampleStorage === SampleStorageOption.No),
    CB_Save_Yes: checkbox(data.sampleStorage === SampleStorageOption.Yes),

    // Checkbox - Payment Method (disabled - always unchecked)
    CB_Cash: UNCHECKED_BOX,
    CB_Credit: UNCHECKED_BOX,

    // Người gửi mẫu và người nhận mẫu
    SampleSender: data.contactPerson || '',
    SampleReceiver: '', // Will be empty in offline mode (no current user context)
  };
}
