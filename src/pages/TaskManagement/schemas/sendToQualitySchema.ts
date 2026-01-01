import * as yup from "yup";

export interface SendToQualityFormData {
  qualityManagerId: string;
}

export const sendToQualitySchema: yup.ObjectSchema<SendToQualityFormData> = yup.object({
  qualityManagerId: yup.string().required("Vui lòng chọn Quản lý chất lượng"),
});
