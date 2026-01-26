import { getAllProvince, getWardsByProvinceId } from 'new-vn-provinces/provinces';
import { getAllWards } from 'new-vn-provinces/wards';

export interface Province {
  code: string;
  name: string;
  slug?: string;
  unit?: string;
}

export interface District {
  code: string;
  name: string;
  slug?: string;
  unit?: string;
  provinceCode: string;
  provinceName?: string;
  fullName?: string;
}

export interface Ward {
  code: string;
  name: string;
  slug?: string;
  unit?: string;
  districtCode?: string;
  districtName?: string;
  provinceCode: string;
  provinceName?: string;
  fullName?: string;
}

// Cache for provinces and wards to avoid repeated async calls
let cachedProvinces: Province[] | null = null;
let cachedWardsMap: Map<string, Ward[]> = new Map();
let cachedAllWards: Ward[] | null = null;

/**
 * Get all provinces (async)
 * Caches result for subsequent calls
 */
export const getAllProvinces = async (): Promise<Province[]> => {
  if (cachedProvinces) {
    return cachedProvinces;
  }

  const provinces = await getAllProvince();
  cachedProvinces = provinces.map((p: any) => ({
    code: p.idProvince,
    name: p.name,
    slug: p.name.toLowerCase().replace(/\s+/g, '-'),
    unit: p.name.includes('Thành phố') ? 'Thành phố' : 'Tỉnh',
  }));

  return cachedProvinces;
};

/**
 * Get all wards (async)
 * Caches result for subsequent calls
 */
export const getAllWardsAsync = async (): Promise<Ward[]> => {
  if (cachedAllWards) {
    return cachedAllWards;
  }

  const wards = await getAllWards();
  cachedAllWards = wards.map((w: any) => ({
    code: w.idWard,
    name: w.name,
    provinceCode: w.idProvince,
    slug: w.name.toLowerCase().replace(/\s+/g, '-'),
    unit: w.name.includes('Phường') ? 'Phường' : w.name.includes('Xã') ? 'Xã' : 'Thị trấn',
  }));

  return cachedAllWards;
};

/**
 * Get wards by province code (async)
 * Caches result for subsequent calls
 */
export const getWardsByProvince = async (provinceCode: string): Promise<Ward[]> => {
  if (!provinceCode) return [];

  // Check cache first
  if (cachedWardsMap.has(provinceCode)) {
    return cachedWardsMap.get(provinceCode)!;
  }

  try {
    const wards = await getWardsByProvinceId(provinceCode);
    const mappedWards = wards.map((w: any) => ({
      code: w.idWard,
      name: w.name,
      provinceCode: w.idProvince,
      slug: w.name.toLowerCase().replace(/\s+/g, '-'),
      unit: w.name.includes('Phường') ? 'Phường' : w.name.includes('Xã') ? 'Xã' : 'Thị trấn',
    }));

    // Cache the result
    cachedWardsMap.set(provinceCode, mappedWards);
    return mappedWards;
  } catch (error) {
    console.error('Error loading wards for province:', provinceCode, error);
    return [];
  }
};

/**
 * Get wards by district code - filter from all wards
 * Note: new-vn-provinces doesn't have district level, so we filter from all wards
 * @deprecated District level is not available in new-vn-provinces
 */
export const getWardsByDistrict = async (districtCode: string): Promise<Ward[]> => {
  if (!districtCode) return [];
  const allWards = await getAllWardsAsync();
  return allWards.filter((w) => w.districtCode === districtCode);
};

/**
 * Get districts by province code
 * @deprecated District level is not available in new-vn-provinces
 */
export const getDistrictsByProvince = (provinceCode: string): District[] => {
  console.warn('getDistrictsByProvince is deprecated: District level is not available in new-vn-provinces');
  return [];
};

/**
 * Get province name by code (async)
 */
export const getProvinceNameByCode = async (code: string): Promise<string> => {
  if (!code) return '';
  const provinces = await getAllProvinces();
  const province = provinces.find((p) => p.code === code);
  return province?.name || '';
};

/**
 * Get district name by code
 * @deprecated District level is not available in new-vn-provinces
 */
export const getDistrictNameByCode = (provinceCode: string, districtCode: string): string => {
  console.warn('getDistrictNameByCode is deprecated: District level is not available in new-vn-provinces');
  return '';
};

/**
 * Get ward name by code (async)
 */
export const getWardNameByCode = async (provinceCode: string, wardCode: string): Promise<string> => {
  if (!provinceCode || !wardCode) return '';
  const wards = await getWardsByProvince(provinceCode);
  const ward = wards.find((w) => w.code === wardCode);
  return ward?.name || '';
};

/**
 * Clear all caches
 * Useful for testing or forcing reload
 */
export const clearLocationCache = (): void => {
  cachedProvinces = null;
  cachedWardsMap.clear();
  cachedAllWards = null;
};

/**
 * Preload location data for better performance
 * Call this during app initialization
 */
export const preloadLocationData = async (): Promise<void> => {
  await getAllProvinces();
  // Optionally preload all wards
  // await getAllWardsAsync();
};
