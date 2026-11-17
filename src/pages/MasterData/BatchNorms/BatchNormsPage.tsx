import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import {
  batchNormService,
  type BatchNormMethodDto,
  type MethodBatchNormDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import BatchNormsView from "./BatchNorms/BatchNormsView";

/** Container L3 — Định mức tiêu hao theo mẻ */
const BatchNormsPage: React.FC = () => {
  const [methods, setMethods] = useState<BatchNormMethodDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMethods(await batchNormService.getMethods());
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tải được danh sách phương pháp"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Lọc phía FE: danh sách phương pháp nhỏ, tránh gọi lại API mỗi lần gõ
  const visibleMethods = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return methods.filter(
      (m) =>
        (!onlyMissing || !m.hasCompleteNorm || expandedKeys.includes(m.testMethodId)) &&
        (!kw || m.code.toLowerCase().includes(kw) || m.name.toLowerCase().includes(kw))
    );
  }, [methods, keyword, onlyMissing, expandedKeys]);

  const handleNormsChanged = useCallback((testMethodId: string, norms: MethodBatchNormDto[]) => {
    const active = norms.filter((n) => n.isActive);
    setMethods((prev) =>
      prev.map((m) =>
        m.testMethodId === testMethodId
          ? { ...m, normCount: active.length, hasCompleteNorm: active.some((n) => n.isComplete) }
          : m
      )
    );
  }, []);

  return (
    <BatchNormsView
      methods={visibleMethods}
      loading={loading}
      keyword={keyword}
      onlyMissing={onlyMissing}
      expandedKeys={expandedKeys}
      onKeywordChange={setKeyword}
      onOnlyMissingChange={setOnlyMissing}
      onReload={load}
      onExpandedKeysChange={setExpandedKeys}
      onNormsChanged={handleNormsChanged}
    />
  );
};

export default BatchNormsPage;
