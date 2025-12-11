export interface SpecimenDto {
  id: string;
  testRequestId: string;
  code: string;
  name: string;
  type: string;
  receivedDate: string;
  status: SpecimenStatus;
  storageLocation?: string;
  notes?: string;
  images?: string;
  deviation?: string;
  quantity: number;
  unit: string;
  testRequestNumber?: string;
  // Audit fields from ABP Framework
  isDeleted?: boolean;
  deleterId?: string | null;
  deletionTime?: string | null;
  lastModificationTime?: string | null;
  lastModifierId?: string | null;
  creationTime?: string;
  creatorId?: string | null;
}

export interface CreateSpecimenDto {
  testRequestId: string;
  name: string;
  type: string;
  receivedDate: string;
  storageLocation?: string;
  notes?: string;
  images?: string;
  deviation?: string;
  quantity: number;
  unit: string;
}

export interface UpdateSpecimenDto {
  testRequestId: string;
  name: string;
  type: string;
  receivedDate: string;
  status: SpecimenStatus;
  storageLocation?: string;
  notes?: string;
  images?: string;
  deviation?: string;
  quantity: number;
  unit: string;
}

export enum SpecimenStatus {
  Received = 0,
  Testing = 1,
  Storage = 2,
  Disposal = 3,
  Destroyed = 4,
  ReturnedToCustomer = 5
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface PagedAndSortedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}
