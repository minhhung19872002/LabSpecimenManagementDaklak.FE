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
export const getDistrictsByProvince = (_provinceCode: string): District[] => {
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
export const getDistrictNameByCode = (_provinceCode: string, _districtCode: string): string => {
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
 * Remove Vietnamese diacritics and normalize to ASCII
 * Handles Unicode NFC/NFD, different font encodings
 */
const removeVietnameseDiacritics = (text: string): string => {
  // Normalize Unicode (NFC/NFD → composed form)
  const normalized = text.normalize('NFC');

  const map: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  };

  return normalized
    .split('')
    .map(c => map[c] || c)
    .join('');
};

/**
 * Normalize Vietnamese text for fuzzy matching
 * Removes common prefixes (Tỉnh, Thành phố, Phường, Xã, etc.) and trims
 */
const normalizeForMatch = (text: string): string => {
  return text
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/^(tỉnh|thành phố|tp\.?|phường|xã|thị trấn|huyện|quận)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Normalize + remove diacritics for ASCII-level fuzzy matching
 */
const normalizeAscii = (text: string): string => {
  return removeVietnameseDiacritics(normalizeForMatch(text))
    .replace(/^(tinh|thanh pho|tp\.?|phuong|xa|thi tran|huyen|quan)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Find province code by name (fuzzy match using new-vn-provinces)
 */
export const findProvinceCode = async (provinceName: string): Promise<string | null> => {
  if (!provinceName?.trim()) return null;

  const provinces = await getAllProvinces();
  const input = provinceName.trim().toLowerCase();
  const normalized = normalizeForMatch(provinceName);

  // Exact match
  let match = provinces.find(p => p.name.toLowerCase() === input);
  if (match) return match.code;

  // Normalized match (remove prefixes)
  match = provinces.find(p => normalizeForMatch(p.name) === normalized);
  if (match) return match.code;

  // Contains match
  match = provinces.find(p =>
    normalizeForMatch(p.name).includes(normalized) ||
    normalized.includes(normalizeForMatch(p.name))
  );
  if (match) return match.code;

  // ASCII fallback (remove diacritics for different font/encoding)
  const ascii = normalizeAscii(provinceName);
  match = provinces.find(p => normalizeAscii(p.name) === ascii);
  if (match) return match.code;

  match = provinces.find(p =>
    normalizeAscii(p.name).includes(ascii) ||
    ascii.includes(normalizeAscii(p.name))
  );
  if (match) return match.code;

  return null;
};

/**
 * Find ward code by name (fuzzy match using new-vn-provinces)
 */
export const findWardCode = async (wardName: string, provinceCode: string): Promise<string | null> => {
  if (!wardName?.trim() || !provinceCode) return null;

  const wards = await getWardsByProvince(provinceCode);
  const input = wardName.trim().toLowerCase();
  const normalized = normalizeForMatch(wardName);

  // Exact match
  let match = wards.find(w => w.name.toLowerCase() === input);
  if (match) return match.code;

  // Normalized match (remove prefixes)
  match = wards.find(w => normalizeForMatch(w.name) === normalized);
  if (match) return match.code;

  // Contains match
  match = wards.find(w =>
    normalizeForMatch(w.name).includes(normalized) ||
    normalized.includes(normalizeForMatch(w.name))
  );
  if (match) return match.code;

  // ASCII fallback (remove diacritics for different font/encoding)
  const ascii = normalizeAscii(wardName);
  match = wards.find(w => normalizeAscii(w.name) === ascii);
  if (match) return match.code;

  match = wards.find(w =>
    normalizeAscii(w.name).includes(ascii) ||
    ascii.includes(normalizeAscii(w.name))
  );
  if (match) return match.code;

  return null;
};

/**
 * Resolve province/ward codes for import preview items
 * Uses new-vn-provinces library for latest VN administrative data
 */
export const resolveLocationCodes = async <T extends {
  province?: string;
  provinceCode?: string | null;
  ward?: string;
  wardCode?: string | null;
}>(items: T[]): Promise<T[]> => {
  for (const item of items) {
    const origProvince = item.provinceCode;
    const origWard = item.wardCode;

    // Always resolve province code using FE library (overrides BE codes which may be outdated)
    if (item.province) {
      const resolved = await findProvinceCode(item.province);
      if (resolved) item.provinceCode = resolved;
    }

    // Always resolve ward code using FE library (requires provinceCode)
    if (item.ward && item.provinceCode) {
      const resolved = await findWardCode(item.ward, item.provinceCode);
      if (resolved) item.wardCode = resolved;
    }

    if (origProvince !== item.provinceCode || origWard !== item.wardCode) {
      console.log(`[resolveLocationCodes] "${item.province}" ${origProvince}->${item.provinceCode}, "${item.ward}" ${origWard}->${item.wardCode}`);
    }
  }
  return items;
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
