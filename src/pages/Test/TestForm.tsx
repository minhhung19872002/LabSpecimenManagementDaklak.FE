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
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { testService } from "../../services/testService";
import { specimenService } from "../../services/specimenService";
import { testMethodService } from "../../services/masterDataService";
import { CreateTestDto, UpdateTestDto, TestStatus } from "../../types/test";
import dayjs from "dayjs";
import { PATH_ROUTES } from "../../constants";
import { testSchema, TestFormData } from "./schemas";

const { TextArea } = Input;
const { Option } = Select;

const TestForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditMode = !!id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: yupResolver(testSchema),
    defaultValues: {
      specimenId: "",
      name: "",
      method: "",
      standard: "",
      status: undefined,
      assignmentDate: null,
      startDate: null,
      completionDate: null,
      assigneeId: "",
      estimatedDuration: undefined,
      notes: "",
    },
  });

  // Data for dropdowns
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [testMethods, setTestMethods] = useState<any[]>([]);

  useEffect(() => {
    fetchSpecimens();
    fetchTestMethods();
    if (isEditMode && id) {
      fetchTest(id);
    }
  }, [id]);

  const fetchSpecimens = async () => {
    try {
      const result = await specimenService.getList({
        skipCount: 0,
        maxResultCount: 1000,
      });
      setSpecimens(result.items);
    } catch (error) {
      message.error("Không thể tải danh sách mẫu thử!");
      console.error("Failed to fetch specimens:", error);
    }
  };

  const fetchTestMethods = async () => {
    try {
      const result = await testMethodService.getList({
        skipCount: 0,
        maxResultCount: 1000,
      });
      setTestMethods(result.items);
    } catch (error) {
      message.error("Không thể tải danh sách phương pháp thử!");
      console.error("Failed to fetch test methods:", error);
    }
  };

  const fetchTest = async (testId: string) => {
    setLoading(true);
    try {
      const data = await testService.get(testId);
      reset({
        ...data,
        assignmentDate: data.assignmentDate ? dayjs(data.assignmentDate) : null,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        completionDate: data.completionDate ? dayjs(data.completionDate) : null,
      });
    } catch (error) {
      message.error(t("messages.loadFailed"));
      console.error("Failed to fetch test:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: TestFormData) => {
    setLoading(true);
    try {
      const formData = {
        ...values,
        assignmentDate: values.assignmentDate
          ? (values.assignmentDate as dayjs.Dayjs).toISOString()
          : null,
        startDate: values.startDate
          ? (values.startDate as dayjs.Dayjs).toISOString()
          : null,
        completionDate: values.completionDate
          ? (values.completionDate as dayjs.Dayjs).toISOString()
          : null,
      };

      if (isEditMode && id) {
        await testService.update(id, formData as UpdateTestDto);
        message.success(t("messages.updateSuccess"));
      } else {
        await testService.create(formData as CreateTestDto);
        message.success(t("messages.createSuccess"));
      }
      navigate(PATH_ROUTES.tests.index);
    } catch (error) {
      message.error(
        isEditMode ? t("messages.updateFailed") : t("messages.createFailed")
      );
      console.error("Failed to save test:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Card title={isEditMode ? t("test.editTest") : t("test.createTest")}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          {!isEditMode && (
            <Form.Item
              label={t("test.specimen")}
              required
              validateStatus={errors.specimenId ? "error" : ""}
              help={errors.specimenId?.message}
            >
              <Controller
                name="specimenId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder={t("test.selectSpecimen")}
                    showSearch
                    optionFilterProp="children"
                  >
                    {specimens.map((specimen) => (
                      <Option key={specimen.id} value={specimen.id}>
                        {specimen.code} - {specimen.name}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            label={t("test.name")}
            required
            validateStatus={errors.name ? "error" : ""}
            help={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>

          <Form.Item
            label={t("test.method")}
            required
            validateStatus={errors.method ? "error" : ""}
            help={errors.method?.message}
          >
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Chọn phương pháp thử"
                  showSearch
                  optionFilterProp="children"
                >
                  {testMethods.map((method) => (
                    <Option key={method.id} value={method.name}>
                      {method.code} - {method.name}
                    </Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>

          <Form.Item
            label={t("test.standard")}
            required
            validateStatus={errors.standard ? "error" : ""}
            help={errors.standard?.message}
          >
            <Controller
              name="standard"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Tiêu chuẩn áp dụng (VD: TCVN, QCVN...)"
                />
              )}
            />
          </Form.Item>

          {isEditMode && (
            <>
              <Form.Item
                label={t("test.status.label")}
                validateStatus={errors.status ? "error" : ""}
                help={errors.status?.message}
              >
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <Option value={TestStatus.Pending}>
                        {t("test.status.pending")}
                      </Option>
                      <Option value={TestStatus.Assigned}>
                        {t("test.status.assigned")}
                      </Option>
                      <Option value={TestStatus.InProgress}>
                        {t("test.status.inProgress")}
                      </Option>
                      <Option value={TestStatus.Completed}>
                        {t("test.status.completed")}
                      </Option>
                      <Option value={TestStatus.Reviewed}>
                        {t("test.status.reviewed")}
                      </Option>
                      <Option value={TestStatus.Approved}>
                        {t("test.status.approved")}
                      </Option>
                    </Select>
                  )}
                />
              </Form.Item>

              <Form.Item label={t("test.assignmentDate")}>
                <Controller
                  name="assignmentDate"
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

              <Form.Item label={t("test.startDate")}>
                <Controller
                  name="startDate"
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

              <Form.Item label={t("test.completionDate")}>
                <Controller
                  name="completionDate"
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
            </>
          )}

          <Form.Item label={t("test.assigneeId")}>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="Nhập ID người thực hiện"
                />
              )}
            />
          </Form.Item>

          <Form.Item label={t("test.estimatedDuration")}>
            <Controller
              name="estimatedDuration"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  min={0}
                  style={{ width: "100%" }}
                  placeholder={t("test.estimatedDurationPlaceholder")}
                />
              )}
            />
          </Form.Item>

          <Form.Item label={t("test.notes")}>
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
              <Button onClick={() => navigate(PATH_ROUTES.tests.index)}>
                {t("common.cancel")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TestForm;
