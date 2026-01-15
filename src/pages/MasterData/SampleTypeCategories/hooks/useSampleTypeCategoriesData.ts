import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  sampleTypeCategoryService,
  specimenTypeService,
  SpecimenTypeDto,
} from "../../../../services/masterDataService";
import { SampleTypeCategoryDto, GroupedCategoryData, SpecimenTypeWithKey } from "../types";

export const useSampleTypeCategoriesData = () => {
  const [categories, setCategories] = useState<SampleTypeCategoryDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesData, specimenTypesData] = await Promise.all([
        sampleTypeCategoryService.getWithCount(),
        specimenTypeService.getActive(),
      ]);

      setCategories(categoriesData || []);
      setSpecimenTypes(specimenTypesData?.items || []);

      // Expand all categories on initial load
      if (isInitialLoad) {
        setExpandedRowKeys((categoriesData || []).map((c) => c.id));
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu danh mục loại mẫu");
      setCategories([]);
      setSpecimenTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter categories and specimen types by search text
  const filteredCategories = useMemo(() => {
    if (!searchText) return categories;

    const lowerSearch = searchText.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name?.toLowerCase().includes(lowerSearch) ||
        cat.description?.toLowerCase().includes(lowerSearch)
    );
  }, [categories, searchText]);

  const filteredSpecimenTypes = useMemo(() => {
    if (!searchText) return specimenTypes;

    const lowerSearch = searchText.toLowerCase();
    return specimenTypes.filter(
      (type) =>
        type.name?.toLowerCase().includes(lowerSearch) ||
        type.description?.toLowerCase().includes(lowerSearch) ||
        type.code?.toLowerCase().includes(lowerSearch)
    );
  }, [specimenTypes, searchText]);

  // Group specimen types by category
  const groupedData: GroupedCategoryData[] = useMemo(() => {
    // Create a map of categoryId -> specimenTypes
    const categoryMap = new Map<string, SpecimenTypeWithKey[]>();

    // Use filtered specimen types if searching, otherwise use all
    const typesToGroup = searchText ? filteredSpecimenTypes : specimenTypes;

    typesToGroup.forEach((type) => {
      const typeWithKey: SpecimenTypeWithKey = {
        ...type,
        key: type.id,
      };

      // Only group specimen types that have a category
      if (type.sampleTypeCategoryId) {
        if (!categoryMap.has(type.sampleTypeCategoryId)) {
          categoryMap.set(type.sampleTypeCategoryId, []);
        }
        categoryMap.get(type.sampleTypeCategoryId)!.push(typeWithKey);
      }
    });

    // Build grouped data from categories (filtered or all)
    const categoriesToShow = searchText ? filteredCategories : categories;

    // If searching, show categories that match OR have matching specimen types
    const result: GroupedCategoryData[] = categoriesToShow
      .filter((category) => {
        if (!searchText) return true;
        // Show if category matches search
        const catMatches = category.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchText.toLowerCase());
        // Or if it has matching specimen types
        const hasMatchingTypes = categoryMap.has(category.id) && categoryMap.get(category.id)!.length > 0;
        return catMatches || hasMatchingTypes;
      })
      .map((category) => ({
        ...category,
        key: category.id,
        specimenTypes: categoryMap.get(category.id) || [],
      }));

    return result;
  }, [categories, specimenTypes, filteredCategories, filteredSpecimenTypes, searchText]);

  return {
    categories,
    specimenTypes,
    loading,
    searchText,
    expandedRowKeys,
    groupedData,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
  };
};
