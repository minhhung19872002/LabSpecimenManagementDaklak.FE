import {
  getProvinces,
  getDistricts,
  getWards,
} from 'vn-provinces';

export interface Province {
  code: string;
  name: string;
  slug: string;
  unit: string;
}

export interface District {
  code: string;
  name: string;
  slug: string;
  unit: string;
  provinceCode: string;
  provinceName: string;
  fullName: string;
}

export interface Ward {
  code: string;
  name: string;
  slug: string;
  unit: string;
  districtCode: string;
  districtName: string;
  provinceCode: string;
  provinceName: string;
  fullName: string;
}

// Cache all districts and wards for filtering
const allDistricts: District[] = getDistricts();
const allWards: Ward[] = getWards();

// Get all provinces
export const getAllProvinces = (): Province[] => {
  return getProvinces();
};

// Get districts by province code - filter from all districts
export const getDistrictsByProvince = (provinceCode: string): District[] => {
  if (!provinceCode) return [];
  return allDistricts.filter((d) => d.provinceCode === provinceCode);
};

// Get wards by district code - filter from all wards
export const getWardsByDistrict = (districtCode: string): Ward[] => {
  if (!districtCode) return [];
  return allWards.filter((w) => w.districtCode === districtCode);
};

// Get province name by code
export const getProvinceNameByCode = (code: string): string => {
  const provinces = getProvinces();
  const province = provinces.find((p: Province) => p.code === code);
  return province?.name || '';
};

// Get district name by code
export const getDistrictNameByCode = (provinceCode: string, districtCode: string): string => {
  if (!provinceCode || !districtCode) return '';
  const districts = getDistricts();
  const district = districts.find((d: District) => d.code === districtCode);
  return district?.name || '';
};

// Get ward name by code
export const getWardNameByCode = (districtCode: string, wardCode: string): string => {
  if (!districtCode || !wardCode) return '';
  const wards = getWards();
  const ward = wards.find((w: any) => w.code === wardCode);
  return ward?.name || '';
};
