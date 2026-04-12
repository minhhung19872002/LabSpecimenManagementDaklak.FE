import { useState, useCallback } from "react";
import { message } from "antd";
import {
  testMethodService,
  specimenTypeService,
  IndicatorMethodDto,
  SpecimenTypeDto,
  TestMethodDto,
} from "../../../../services/masterDataService";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

interface UseIndicatorMethodsActionsParams {
  invalidateMethodsMap: () => void;
  fetchData: () => Promise<void>;
}

interface AddMethodTarget {
  id: string;
  name: string;
  formattedName?: string;
  existingKeys: { testMethodId: string; specimenTypeId?: string }[];
}

export const useIndicatorMethodsActions = ({
  invalidateMethodsMap,
  fetchData,
}: UseIndicatorMethodsActionsParams) => {
  // Shared data (lazy loaded)
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [testMethods, setTestMethods] = useState<TestMethodDto[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Add modal state
  const [addMethodModalOpen, setAddMethodModalOpen] = useState(false);
  const [addMethodLoading, setAddMethodLoading] = useState(false);
  const [addMethodTarget, setAddMethodTarget] =
    useState<AddMethodTarget | null>(null);

  // Edit modal state
  const [editMethodModalOpen, setEditMethodModalOpen] = useState(false);
  const [editMethodLoading, setEditMethodLoading] = useState(false);
  const [editingMethod, setEditingMethod] =
    useState<IndicatorMethodDto | null>(null);
  const [editMethodIndicatorId, setEditMethodIndicatorId] = useState("");
  const [editMethodIndicatorName, setEditMethodIndicatorName] = useState("");
  const [editMethodIndicatorFormattedName, setEditMethodIndicatorFormattedName] =
    useState<string | undefined>(undefined);
  const [editMethodExistingKeys, setEditMethodExistingKeys] = useState<
    { testMethodId: string; specimenTypeId?: string }[]
  >([]);

  // Lazy load specimen types and test methods
  const ensureDataLoaded = useCallback(async () => {
    if (dataLoaded) return;
    try {
      const [stResult, tmResult] = await Promise.all([
        specimenTypeService.getActive(),
        testMethodService.getActive(),
      ]);
      setSpecimenTypes(stResult.items || []);
      setTestMethods(tmResult.items || []);
      setDataLoaded(true);
    } catch (error) {
      console.error("Failed to load specimen types / test methods:", error);
      message.error("Không thể tải dữ liệu nền mẫu / phương pháp thử");
    }
  }, [dataLoaded]);

  // --- Add method handlers ---

  const handleOpenAddMethod = useCallback(
    async (
      indicatorId: string,
      indicatorName: string,
      indicatorFormattedName: string | undefined,
      existingMethods: IndicatorMethodDto[]
    ) => {
      await ensureDataLoaded();
      const existingKeys = existingMethods.map((m) => ({
        testMethodId: m.testMethodId,
        specimenTypeId: m.specimenTypeId,
      }));
      setAddMethodTarget({
        id: indicatorId,
        name: indicatorName,
        formattedName: indicatorFormattedName,
        existingKeys,
      });
      setAddMethodModalOpen(true);
    },
    [ensureDataLoaded]
  );

  const handleAddMethodOk = useCallback(
    async (
      rows: {
        specimenTypeId: string;
        testMethodId: string;
        unit: string;
        formattedUnit: string;
        unitPrice: number;
      }[]
    ) => {
      if (!addMethodTarget) return;

      try {
        setAddMethodLoading(true);

        // Group rows by testMethodId
        const groupedByTestMethod = new Map<
          string,
          {
            indicatorId: string;
            specimenTypeId: string;
            unitPrice: number;
            unit?: string;
            formattedUnit?: string;
          }[]
        >();

        for (const row of rows) {
          const existing = groupedByTestMethod.get(row.testMethodId) || [];
          existing.push({
            indicatorId: addMethodTarget.id,
            specimenTypeId: row.specimenTypeId,
            unitPrice: row.unitPrice,
            unit: row.unit || undefined,
            formattedUnit: row.formattedUnit || undefined,
          });
          groupedByTestMethod.set(row.testMethodId, existing);
        }

        // Call addIndicators per testMethod group
        const results = await Promise.allSettled(
          Array.from(groupedByTestMethod.entries()).map(
            ([testMethodId, indicators]) =>
              testMethodService.addIndicators(testMethodId, { indicators })
          )
        );

        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          message.warning(
            `Thêm thành công ${results.length - failed.length}/${results.length} nhóm phương pháp`
          );
        } else {
          message.success(`Thêm ${rows.length} phương pháp thành công!`);
        }

        setAddMethodModalOpen(false);
        setAddMethodTarget(null);
        invalidateMethodsMap();
        fetchData();
      } catch (error: unknown) {
        message.error(
          getApiErrorMessage(error, "Không thể thêm phương pháp")
        );
      } finally {
        setAddMethodLoading(false);
      }
    },
    [addMethodTarget, invalidateMethodsMap, fetchData]
  );

  const handleAddMethodCancel = useCallback(() => {
    setAddMethodModalOpen(false);
    setAddMethodTarget(null);
  }, []);

  // --- Edit method handlers ---

  const handleOpenEditMethod = useCallback(
    async (
      record: IndicatorMethodDto,
      indicatorId: string,
      indicatorName: string,
      indicatorFormattedName: string | undefined,
      existingMethods: IndicatorMethodDto[]
    ) => {
      await ensureDataLoaded();
      setEditingMethod(record);
      setEditMethodIndicatorId(indicatorId);
      setEditMethodIndicatorName(indicatorName);
      setEditMethodIndicatorFormattedName(indicatorFormattedName);
      setEditMethodExistingKeys(
        existingMethods
          .filter((m) => m.testMethodId !== record.testMethodId || m.specimenTypeId !== record.specimenTypeId)
          .map((m) => ({ testMethodId: m.testMethodId, specimenTypeId: m.specimenTypeId }))
      );
      setEditMethodModalOpen(true);
    },
    [ensureDataLoaded]
  );

  const handleEditMethodOk = useCallback(
    async (data: {
      unitPrice: number;
      unit: string;
      formattedUnit: string;
      newTestMethodId?: string;
      newSpecimenTypeId?: string;
    }) => {
      if (!editingMethod) return;

      try {
        setEditMethodLoading(true);
        await testMethodService.updateIndicator(
          editingMethod.testMethodId,
          editMethodIndicatorId,
          editingMethod.specimenTypeId || undefined,
          {
            unitPrice: data.unitPrice,
            unit: data.unit || undefined,
            formattedUnit: data.formattedUnit || undefined,
            newTestMethodId: data.newTestMethodId,
            newSpecimenTypeId: data.newSpecimenTypeId,
          }
        );
        message.success("Cập nhật phương pháp thành công!");
        setEditMethodModalOpen(false);
        setEditingMethod(null);
        invalidateMethodsMap();
      } catch (error: unknown) {
        message.error(
          getApiErrorMessage(error, "Không thể cập nhật phương pháp")
        );
      } finally {
        setEditMethodLoading(false);
      }
    },
    [editingMethod, editMethodIndicatorId, invalidateMethodsMap]
  );

  const handleEditMethodCancel = useCallback(() => {
    setEditMethodModalOpen(false);
    setEditingMethod(null);
  }, []);

  // --- Toggle method active handler ---

  const handleToggleMethodActive = useCallback(
    async (record: IndicatorMethodDto, indicatorId: string) => {
      try {
        await testMethodService.toggleIndicatorActive(
          record.testMethodId,
          indicatorId,
          record.specimenTypeId || undefined
        );
        message.success(
          record.isActive
            ? "Đã ngừng kích hoạt phương pháp"
            : "Đã kích hoạt phương pháp"
        );
        invalidateMethodsMap();
      } catch (error: unknown) {
        message.error(
          getApiErrorMessage(error, "Không thể thay đổi trạng thái")
        );
      }
    },
    [invalidateMethodsMap]
  );

  // --- Delete method handler ---

  const handleDeleteMethod = useCallback(
    async (record: IndicatorMethodDto, indicatorId: string) => {
      try {
        await testMethodService.removeIndicator(
          record.testMethodId,
          indicatorId,
          record.specimenTypeId || undefined
        );
        message.success("Xóa phương pháp thành công!");
        invalidateMethodsMap();
      } catch (error: unknown) {
        message.error(
          getApiErrorMessage(error, "Không thể xóa phương pháp")
        );
      }
    },
    [invalidateMethodsMap]
  );

  return {
    // Shared data
    specimenTypes,
    testMethods,

    // Add method
    addMethodModalOpen,
    addMethodLoading,
    addMethodTarget,
    handleOpenAddMethod,
    handleAddMethodOk,
    handleAddMethodCancel,

    // Edit method
    editMethodModalOpen,
    editMethodLoading,
    editingMethod,
    editMethodIndicatorName,
    editMethodIndicatorFormattedName,
    editMethodExistingKeys,
    handleOpenEditMethod,
    handleEditMethodOk,
    handleEditMethodCancel,

    // Toggle method active
    handleToggleMethodActive,

    // Delete method
    handleDeleteMethod,
  };
};
