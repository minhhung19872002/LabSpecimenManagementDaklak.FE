export interface OrganizationDto {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  creationTime?: string;
  lastModificationTime?: string;
}

export interface CreateUpdateOrganizationDto {
  name: string;
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
