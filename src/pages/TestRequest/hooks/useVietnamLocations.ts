import { useState, useCallback } from "react";
import {
  getAllProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  Province,
  District,
  Ward,
} from "../../../utils/vietnamLocations";

export const useVietnamLocations = () => {
  const [provinces] = useState<Province[]>(getAllProvinces());
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const loadDistricts = useCallback((provinceCode: string) => {
    if (provinceCode) {
      setDistricts(getDistrictsByProvince(provinceCode));
    } else {
      setDistricts([]);
    }
    setWards([]);
  }, []);

  const loadWards = useCallback((districtCode: string) => {
    if (districtCode) {
      setWards(getWardsByDistrict(districtCode));
    } else {
      setWards([]);
    }
  }, []);

  const loadLocationsFromData = useCallback((provinceCode?: string, districtCode?: string) => {
    if (provinceCode) {
      const loadedDistricts = getDistrictsByProvince(provinceCode);
      setDistricts(loadedDistricts);

      if (districtCode) {
        const loadedWards = getWardsByDistrict(districtCode);
        setWards(loadedWards);
      }
    }
  }, []);

  return {
    provinces,
    districts,
    wards,
    setDistricts,
    setWards,
    loadDistricts,
    loadWards,
    loadLocationsFromData,
  };
};
