import {
  TestRequestStatus,
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
} from "../../../types/testRequest";

export const FORM_INITIAL_VALUES = {
  status: TestRequestStatus.Pending,
  resultLanguage: ResultLanguage.Vietnamese,
  samplingRequirement: SamplingRequirement.CustomerSampling,
  sampleStorageOption: SampleStorageOption.No,
};

export const LOCKED_FIELDS = [
  "contractNumber",
  "contractDate",
  "customerName",
  "address",
  "taxCode",
  "contactPerson",
  "phone",
  "provinceCode",
  "districtCode",
  "wardCode",
];

export const PROCESSING_STATUS_OPTIONS = [
  { value: "Đã nhận", label: "Đã nhận" },
  { value: "Đang thử nghiệm", label: "Đang thử nghiệm" },
  { value: "Hoàn thành", label: "Hoàn thành" },
  { value: "Trả kết quả", label: "Trả kết quả" },
];

export const FORM_MESSAGES = {
  saveSuccess: "Lưu yêu cầu thành công!",
  createSuccess: "Tạo yêu cầu thành công!",
  updateSuccess: "Cập nhật yêu cầu thành công!",
  saveError: "Không thể lưu yêu cầu. Vui lòng thử lại.",
  noSamples: "Vui lòng thêm ít nhất một mẫu xét nghiệm",
  invalidSamples: "Vui lòng điền đầy đủ mã mẫu và tên mẫu cho tất cả các mẫu",
  cannotEdit: "Không thể chỉnh sửa phiếu ở trạng thái này",
  cannotAddSample: "Không thể thêm mẫu khi phiếu đang thực hiện",
  cannotDeleteSample: "Không thể xóa mẫu khi phiếu đang thực hiện",
  cannotChangeIndicator: "Không thể thay đổi chỉ tiêu khi phiếu đang thực hiện",
  selectIndicatorFirst: "Vui lòng chọn ít nhất một chỉ tiêu để gửi khoa phòng",
  selectLaboratory: "Vui lòng chọn khoa phòng",
  selectRequestDate: "Vui lòng chọn ngày yêu cầu xong",
  transferDateInvalid: "Ngày chuyển giao không được lớn hơn ngày yêu cầu",
  requestDateInvalid: "Ngày yêu cầu không được nhỏ hơn ngày chuyển giao",
  indicatorsNotSent: (count: number) =>
    `Còn ${count} chỉ tiêu chưa được gửi đến khoa phòng. Vui lòng gửi tất cả chỉ tiêu trước khi lưu.`,
  sentToLaboratory: (count: number, labName: string) =>
    `Đã gửi ${count} chỉ tiêu đến ${labName}`,
};
