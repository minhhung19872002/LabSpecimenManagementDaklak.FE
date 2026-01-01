import { useState, useEffect } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Card,
  message,
  Select,
  Row,
  Col,
  InputNumber,
  Divider,
  Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { specimenService } from "../../services/specimenService";
import { testRequestService } from "../../services/testRequestService";
import {
  specimenTypeService,
  storageLocationService,
} from "../../services/masterDataService";
import { SpecimenStatus } from "../../types/specimen";
import dayjs from "dayjs";
import FileUpload from "../../components/common/FileUpload";
import { PATH_ROUTES } from "../../constants";
import { specimenFormSchema, SpecimenFormData } from "./schemas/specimenFormSchema";

const { TextArea } = Input;
const { Title } = Typography;

const SpecimenForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [specimenImages, setSpecimenImages] = useState<any[]>([]);
  const isEditMode = !!id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SpecimenFormData>({
    resolver: yupResolver(specimenFormSchema),
    defaultValues: {
      testRequestId: "",
      receivedDate: dayjs(),
      name: "",
      type: "",
      quantity: 1,
      unit: "Cái",
      storageLocation: "",
      deviation: "",
      status: SpecimenStatus.Received,
      notes: "",
    },
  });

  // Data from API
  const [testRequests, setTestRequests] = useState<any[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<any[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);

  // Load master data
  const loadMasterData = async () => {
    try {
      const [requestsResult, typesResult, locationsResult] = await Promise.all([
        testRequestService.getList({ maxResultCount: 1000 }),
        specimenTypeService.getActive(),
        storageLocationService.getActive(),
      ]);
      setTestRequests(
        requestsResult.items.map((tr: any) => ({
          id: tr.id,
          requestNumber: tr.requestNumber,
          customerName: tr.customerName,
        }))
      );
      setSpecimenTypes(typesResult.items);
      setStorageLocations(locationsResult.items);
    } catch (error) {
      console.error("Error loading master data:", error);
      message.error("Không thể tải dữ liệu danh mục");
    }
  };

  useEffect(() => {
    loadMasterData();
    if (isEditMode) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      const data = await specimenService.get(id);
      reset({
        ...data,
        receivedDate: data.receivedDate ? dayjs(data.receivedDate) : dayjs(),
      });
      if (data.images) {
        try {
          const parsedImages = JSON.parse(data.images);
          setSpecimenImages(Array.isArray(parsedImages) ? parsedImages : []);
        } catch {
          setSpecimenImages([]);
        }
      }
    } catch (error: any) {
      message.error(t("messages.loadFailed"));
      console.error("Failed to load specimen:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (values: SpecimenFormData) => {
    setLoading(true);
    try {
      const imagesData = specimenImages.map((f) => ({
        name: f.name,
        url: f.url || f.response?.url,
        type: f.type,
      }));

      const basePayload = {
        testRequestId: values.testRequestId,
        name: values.name,
        type: values.type,
        receivedDate: values.receivedDate
          ? (values.receivedDate as dayjs.Dayjs).toISOString()
          : new Date().toISOString(),
        storageLocation: values.storageLocation || undefined,
        notes: values.notes || undefined,
        images: JSON.stringify(imagesData),
        deviation: values.deviation || undefined,
        quantity: values.quantity,
        unit: values.unit,
      };

      if (isEditMode && id) {
        await specimenService.update(id, {
          ...basePayload,
          status: values.status as SpecimenStatus,
        });
        message.success(t("messages.updateSuccess"));
      } else {
        await specimenService.create(basePayload);
        message.success(t("messages.createSuccess"));
      }
      navigate(PATH_ROUTES.specimens.index);
    } catch (error: any) {
      message.error(
        isEditMode ? t("messages.updateFailed") : t("messages.createFailed")
      );
      console.error("Failed to save specimen:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        isEditMode ? t("specimen.editSpecimen") : t("specimen.createSpecimen")
      }
      loading={loadingData}
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* Thông tin cơ bản */}
        <Title level={5}>Thông tin mẫu</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t("specimen.testRequest")}
              required
              validateStatus={errors.testRequestId ? "error" : ""}
              help={errors.testRequestId?.message}
            >
              <Controller
                name="testRequestId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder={t("specimen.selectTestRequest")}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      ((option?.children as unknown as string) || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {testRequests.map((tr) => (
                      <Select.Option key={tr.id} value={tr.id}>
                        {tr.requestNumber} - {tr.customerName}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t("specimen.receivedDate")}
              required
              validateStatus={errors.receivedDate ? "error" : ""}
              help={errors.receivedDate?.message}
            >
              <Controller
                name="receivedDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t("specimen.name")}
              required
              validateStatus={errors.name ? "error" : ""}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Tên mẫu thử nghiệm" />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t("specimen.type")}
              required
              validateStatus={errors.type ? "error" : ""}
              help={errors.type?.message}
            >
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Chọn loại mẫu"
                    showSearch
                    optionFilterProp="children"
                  >
                    {specimenTypes.map((type) => (
                      <Select.Option key={type.id} value={type.name}>
                        {type.code} - {type.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t("specimen.quantity")}
              required
              validateStatus={errors.quantity ? "error" : ""}
              help={errors.quantity?.message}
            >
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} style={{ width: "100%" }} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t("specimen.unit")}
              required
              validateStatus={errors.unit ? "error" : ""}
              help={errors.unit?.message}
            >
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Đơn vị">
                    <Select.Option value="mL">mL</Select.Option>
                    <Select.Option value="ống">Ống</Select.Option>
                    <Select.Option value="tube">Tube</Select.Option>
                    <Select.Option value="swab">Swab</Select.Option>
                    <Select.Option value="mẫu">Mẫu</Select.Option>
                    <Select.Option value="lọ">Lọ</Select.Option>
                    <Select.Option value="slide">Slide</Select.Option>
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t("specimen.storageLocation")}
              validateStatus={errors.storageLocation ? "error" : ""}
              help={errors.storageLocation?.message}
            >
              <Controller
                name="storageLocation"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Vị trí lưu mẫu"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {storageLocations.map((loc) => (
                      <Select.Option key={loc.id} value={loc.name}>
                        {loc.code} - {loc.name} ({loc.temperature || "N/A"})
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Hình ảnh mẫu */}
        <Title level={5}>Hình ảnh mẫu</Title>
        <Form.Item
          label="Đính kèm hình ảnh mẫu (chụp khi tiếp nhận)"
          tooltip="Hỗ trợ: JPG, PNG, GIF. Tối đa 10 hình, mỗi hình ≤ 5MB"
        >
          <FileUpload
            value={specimenImages}
            onChange={setSpecimenImages}
            maxCount={10}
            accept="image/*"
            maxSize={5}
            listType="picture-card"
          />
        </Form.Item>

        <Divider />

        {/* Sai lệch mẫu */}
        <Title level={5}>Ghi nhận sai lệch</Title>
        <Form.Item
          label="Sai lệch của mẫu (nếu có)"
          tooltip="Ghi nhận các sai lệch so với yêu cầu ban đầu: thiếu số lượng, bao bì hư hỏng, nhiệt độ không đảm bảo..."
          validateStatus={errors.deviation ? "error" : ""}
          help={errors.deviation?.message}
        >
          <Controller
            name="deviation"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                value={field.value || ""}
                rows={3}
                placeholder="Mô tả sai lệch: thiếu số lượng, bao bì hư hỏng, nhiệt độ bảo quản không đảm bảo..."
              />
            )}
          />
        </Form.Item>

        {isEditMode && (
          <>
            <Divider />
            <Title level={5}>Trạng thái mẫu</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t("specimen.status.label")}
                  validateStatus={errors.status ? "error" : ""}
                  help={errors.status?.message}
                >
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <Select.Option value={SpecimenStatus.Received}>
                          {t("specimen.status.received")}
                        </Select.Option>
                        <Select.Option value={SpecimenStatus.Testing}>
                          {t("specimen.status.testing")}
                        </Select.Option>
                        <Select.Option value={SpecimenStatus.Storage}>
                          {t("specimen.status.storage")}
                        </Select.Option>
                        <Select.Option value={SpecimenStatus.Disposal}>
                          {t("specimen.status.disposal")}
                        </Select.Option>
                        <Select.Option value={SpecimenStatus.Destroyed}>
                          {t("specimen.status.destroyed")}
                        </Select.Option>
                        <Select.Option value={SpecimenStatus.ReturnedToCustomer}>
                          {t("specimen.status.returnedToCustomer")}
                        </Select.Option>
                      </Select>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Divider />

        <Form.Item
          label={t("specimen.notes")}
          validateStatus={errors.notes ? "error" : ""}
          help={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                value={field.value || ""}
                rows={4}
                placeholder="Ghi chú thêm về mẫu..."
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? t("common.update") : t("common.create")}
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(PATH_ROUTES.specimens.index)}
          >
            {t("common.cancel")}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SpecimenForm;
