import { SampleStatus, ResultLanguage, SamplingRequirement, SampleStorageOption } from "../../../types/testRequest";
import { SampleStatusConfigs } from "../types";

export const SAMPLE_STATUS_CONFIG: SampleStatusConfigs = {
  [SampleStatus.Normal]: { color: "default", text: "Bình thường" },
  [SampleStatus.Damaged]: { color: "warning", text: "Hư hỏng" },
  [SampleStatus.NotMeetRequirements]: { color: "error", text: "Không đạt YC" },
  [SampleStatus.Testing]: { color: "processing", text: "Đang kiểm nghiệm" },
  [SampleStatus.Completed]: { color: "success", text: "Hoàn thành" },
};

export const RESULT_LANGUAGE_MAP: Record<ResultLanguage, string> = {
  [ResultLanguage.Vietnamese]: "Tiếng Việt",
  [ResultLanguage.English]: "Tiếng Anh",
  [ResultLanguage.VietnameseAndEnglish]: "Tiếng Việt/Anh",
};

export const SAMPLING_REQUIREMENT_MAP: Record<SamplingRequirement, string> = {
  [SamplingRequirement.LabSampling]: "TTKN lấy mẫu",
  [SamplingRequirement.CustomerSampling]: "KH tự lấy mẫu",
};

export const SAMPLE_STORAGE_MAP: Record<SampleStorageOption, string> = {
  [SampleStorageOption.No]: "Không",
  [SampleStorageOption.Yes]: "Có (theo quy định của Trung tâm)",
};

export const DETAIL_MESSAGES = {
  printSuccess: (requestNumber: string) => `Đã tạo phiếu yêu cầu XN: ${requestNumber}`,
  printError: "Không thể tạo phiếu. Vui lòng thử lại.",
  bm01Success: (sampleCode: string) => `Đã tạo phiếu kết quả BM01 cho mẫu ${sampleCode}`,
  bm01Error: "Không thể tạo phiếu kết quả. Vui lòng thử lại.",
  approveSuccess: "Đã phê duyệt thành công",
  approveError: "Không thể phê duyệt. Vui lòng thử lại.",
  sendResultSuccess: "Đã gửi kết quả thành công",
  sendResultError: "Không thể gửi kết quả. Vui lòng thử lại.",
  completeSuccess: "Đã hoàn thành yêu cầu thử nghiệm",
  completeError: "Không thể hoàn thành. Vui lòng thử lại.",
  mixedResultInfo: "Chức năng in KQ hỗn hợp đang được phát triển",
  selectSampleWarning: "Vui lòng chọn một mẫu",
  sampleNotReady: "Mẫu chưa xét nghiệm xong",
  editorLoadError: "Không thể tải OnlyOffice Document Server",
  editorInitError: "Không thể khởi tạo editor",
  editorError: "Có lỗi xảy ra với document editor",
};
