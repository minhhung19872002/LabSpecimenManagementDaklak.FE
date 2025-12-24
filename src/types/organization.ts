export interface OrganizationDto {
  id: string;
  name: string;
  provinceCode: string;
  wardCode: string;
  address: string;
  taxCode?: string;
  contactPerson: string;
  phone: string;
  isActive: boolean;
  sortOrder: number;
  creationTime?: string;
  lastModificationTime?: string;
}

export interface CreateUpdateOrganizationDto {
  name: string;
  provinceCode: string;
  wardCode: string;
  address: string;
  taxCode?: string;
  contactPerson: string;
  phone: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface GetOrganizationListDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  isActive?: boolean;
}
