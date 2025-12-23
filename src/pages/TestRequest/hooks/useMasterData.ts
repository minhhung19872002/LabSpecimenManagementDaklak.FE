import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  useGetActiveIndicatorGroupsQuery,
  useGetActiveIndicatorsQuery,
  useGetActiveStorageLocationsQuery,
  useGetActiveLaboratoriesQuery,
} from "../../../store/api/masterDataApi";
import { useGetUserLookupQuery } from "../../../store/api/userApi";
import { useGetActiveOrganizationsQuery } from "../../../store/api/organizationApi";
import { IndicatorTreeNode, OrganizationOption } from "../types";

export const useMasterData = () => {
  const { data: indicatorGroupsData } = useGetActiveIndicatorGroupsQuery();
  const { data: indicatorsData } = useGetActiveIndicatorsQuery();
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();
  const { data: laboratoriesData } = useGetActiveLaboratoriesQuery();
  const { data: usersData } = useGetUserLookupQuery();
  const { data: organizationsData } = useGetActiveOrganizationsQuery();

  const indicatorGroups = useMemo(() => indicatorGroupsData || [], [indicatorGroupsData]);
  const indicators = useMemo(() => indicatorsData || [], [indicatorsData]);
  const storageLocations = useMemo(() => storageLocationsData?.items || [], [storageLocationsData]);
  const laboratories = useMemo(() => laboratoriesData || [], [laboratoriesData]);
  const users = useMemo(() => usersData || [], [usersData]);
  const organizations = useMemo(() => organizationsData || [], [organizationsData]);

  // Build indicator tree data
  const indicatorTreeData = useMemo<IndicatorTreeNode[]>(() => {
    if (indicatorGroups.length === 0 || indicators.length === 0) return [];

    return indicatorGroups
      .map((group) => ({
        title: group.name,
        value: `group-${group.id}`,
        key: `group-${group.id}`,
        selectable: false,
        children: indicators
          .filter((ind) => ind.indicatorGroupId === group.id && ind.isActive)
          .map((ind) => ({
            title: `${ind.name} (${ind.unitPrice.toLocaleString("vi-VN")}đ)`,
            value: ind.id,
            key: ind.id,
          })),
      }))
      .filter((group) => group.children.length > 0);
  }, [indicatorGroups, indicators]);

  return {
    indicatorGroups,
    indicators,
    storageLocations,
    laboratories,
    users,
    organizations,
    indicatorTreeData,
  };
};

export const useOrganizationSearch = (organizations: any[]) => {
  const [organizationOptions, setOrganizationOptions] = useState<OrganizationOption[]>([]);
  const [organizationSearching, setOrganizationSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOrganizationSearch = useCallback(
    (searchText: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!searchText || searchText.trim().length < 1) {
        setOrganizationOptions([]);
        setOrganizationSearching(false);
        return;
      }

      setOrganizationSearching(true);

      debounceTimerRef.current = setTimeout(() => {
        const filtered = organizations
          .filter((org) =>
            org.name.toLowerCase().includes(searchText.toLowerCase())
          )
          .slice(0, 20)
          .map((org) => ({ value: org.name, label: org.name }));

        setOrganizationOptions(filtered);
        setOrganizationSearching(false);
      }, 300);
    },
    [organizations]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    organizationOptions,
    organizationSearching,
    handleOrganizationSearch,
  };
};
