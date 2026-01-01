import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  message,
  InputNumber,
  DatePicker,
  Card,
  Space,
  Checkbox,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { testResultService } from "../../services/testResultService";
import { testService } from "../../services/testService";
import {
  CreateTestResultDto,
  UpdateTestResultDto,
  ResultApprovalStatus,
} from "../../types/testResult";
import { TestDto } from "../../types/test";
import dayjs from "dayjs";
import { PATH_ROUTES } from "../../constants";
import {
  testResultSchema,
  TestResultFormData,
} from "./schemas";

const { TextArea } = Input;
const { Option } = Select;

const TestResultForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<TestDto[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditMode = !!id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TestResultFormData>({
    resolver: yupResolver(testResultSchema),
    defaultValues: {
      testId: "",
      parameter: "",
      value: "",
      unit: "",
      lowerLimit: undefined,
      upperLimit: undefined,
      isPass: false,
      approvalStatus: undefined,
      entryDate: null,
      reviewDate: null,
      reviewComment: "",
      approvalDate: null,
      approvalComment: "",
      chartData: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchTests();
    if (isEditMode && id) {
      fetchTestResult(id);
    }
  }, [id]);

  const fetchTests = async () => {
    try {
      const result = await testService.getList({
        maxResultCount: 1000,
      });
      setTests(result.items);
    } catch (error) {
      message.error(
        "Không thể tải danh sách phép thử. Vui lòng kiểm tra kết nối API."
      );
      console.error("Failed to fetch tests:", error);
    }
  };

  const fetchTestResult = async (testResultId: string) => {
    setLoading(true);
    try {
      const data = await testResultService.get(testResultId);
      reset({
        ...data,
        entryDate: data.entryDate ? dayjs(data.entryDate) : null,
        reviewDate: data.reviewDate ? dayjs(data.reviewDate) : null,
        approvalDate: data.approvalDate ? dayjs(data.approvalDate) : null,
      });
    } catch (error) {
      message.error(
        "Không thể tải thông tin kết quả. Vui lòng kiểm tra kết nối API."
      );
      console.error("Failed to fetch test result:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: TestResultFormData) => {
    setLoading(true);
    try {
      const formData = {
        ...values,
        entryDate: values.entryDate
          ? (values.entryDate as dayjs.Dayjs).toISOString()
          : null,
        reviewDate: values.reviewDate
          ? (values.reviewDate as dayjs.Dayjs).toISOString()
          : null,
        approvalDate: values.approvalDate
          ? (values.approvalDate as dayjs.Dayjs).toISOString()
          : null,
      };

      if (isEditMode && id) {
        await testResultService.update(id, formData as UpdateTestResultDto);
        message.success(t("messages.updateSuccess"));
      } else {
        await testResultService.create(formData as CreateTestResultDto);
        message.success(t("messages.createSuccess"));
      }
      navigate(PATH_ROUTES.testResults.index);
    } catch (error) {
      message.error(
        isEditMode
          ? "Không thể cập nhật kết quả. Vui lòng thử lại."
          : "Không thể tạo kết quả. Vui lòng thử lại."
      );
      console.error("Failed to save test result:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          isEditMode
            ? t("testResult.editTestResult")
            : t("testResult.createTestResult")
        }
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          {!isEditMode && (
            <Form.Item
              label={t("testResult.test")}
              required
              validateStatus={errors.testId ? "error" : ""}
              help={errors.testId?.message}
            >
              <Controller
                name="testId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder={t("testResult.selectTest")}
                    showSearch
                    optionFilterProp="children"
                  >
                    {tests.map((test) => (
                      <Option key={test.id} value={test.id}>
                        {test.code} - {test.name}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            label={t("testResult.parameter")}
            required
            validateStatus={errors.parameter ? "error" : ""}
            help={errors.parameter?.message}
          >
            <Controller
              name="parameter"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>

          <Form.Item
            label={t("testResult.value")}
            required
            validateStatus={errors.value ? "error" : ""}
            help={errors.value?.message}
          >
            <Controller
              name="value"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>

          <Form.Item
            label={t("testResult.unit")}
            required
            validateStatus={errors.unit ? "error" : ""}
            help={errors.unit?.message}
          >
            <Controller
              name="unit"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>

          <Form.Item label={t("testResult.lowerLimit")}>
            <Controller
              name="lowerLimit"
              control={control}
              render={({ field }) => (
                <InputNumber {...field} min={0} style={{ width: "100%" }} />
              )}
            />
          </Form.Item>

          <Form.Item label={t("testResult.upperLimit")}>
            <Controller
              name="upperLimit"
              control={control}
              render={({ field }) => (
                <InputNumber {...field} min={0} style={{ width: "100%" }} />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Controller
              name="isPass"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                >
                  {t("testResult.isPass")}
                </Checkbox>
              )}
            />
          </Form.Item>

          {isEditMode && (
            <>
              <Form.Item
                label={t("testResult.approvalStatus.label")}
                validateStatus={errors.approvalStatus ? "error" : ""}
                help={errors.approvalStatus?.message}
              >
                <Controller
                  name="approvalStatus"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <Option value={ResultApprovalStatus.Draft}>
                        {t("testResult.approvalStatus.draft")}
                      </Option>
                      <Option value={ResultApprovalStatus.Submitted}>
                        {t("testResult.approvalStatus.submitted")}
                      </Option>
                      <Option value={ResultApprovalStatus.Step1Reviewed}>
                        {t("testResult.approvalStatus.step1Reviewed")}
                      </Option>
                      <Option value={ResultApprovalStatus.Step2Approved}>
                        {t("testResult.approvalStatus.step2Approved")}
                      </Option>
                      <Option value={ResultApprovalStatus.Rejected}>
                        {t("testResult.approvalStatus.rejected")}
                      </Option>
                    </Select>
                  )}
                />
              </Form.Item>

              <Form.Item label={t("testResult.entryDate")}>
                <Controller
                  name="entryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      showTime
                      style={{ width: "100%" }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item label={t("testResult.reviewDate")}>
                <Controller
                  name="reviewDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      showTime
                      style={{ width: "100%" }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item label={t("testResult.reviewComment")}>
                <Controller
                  name="reviewComment"
                  control={control}
                  render={({ field }) => (
                    <TextArea {...field} value={field.value || ""} rows={3} />
                  )}
                />
              </Form.Item>

              <Form.Item label={t("testResult.approvalDate")}>
                <Controller
                  name="approvalDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      showTime
                      style={{ width: "100%" }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item label={t("testResult.approvalComment")}>
                <Controller
                  name="approvalComment"
                  control={control}
                  render={({ field }) => (
                    <TextArea {...field} value={field.value || ""} rows={3} />
                  )}
                />
              </Form.Item>
            </>
          )}

          <Form.Item label={t("testResult.chartData")}>
            <Controller
              name="chartData"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  value={field.value || ""}
                  rows={4}
                  placeholder="JSON format"
                />
              )}
            />
          </Form.Item>

          <Form.Item label={t("testResult.notes")}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextArea {...field} value={field.value || ""} rows={4} />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t("common.save")}
              </Button>
              <Button onClick={() => navigate(PATH_ROUTES.testResults.index)}>
                {t("common.cancel")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TestResultForm;
