export enum SpecimenStatus {
  Received = 0,
  Testing = 1,
  Storage = 2,
  Disposal = 3,
  Destroyed = 4,
  ReturnedToCustomer = 5,
}

export interface SpecimenHistoryDto {
  id: string;
  specimenId: string;
  action: string;
  location: string;
  status: SpecimenStatus;
  notes?: string;
  temperature?: number;
  humidity?: number;
  timestamp?: string;
  performedById?: string;
  performedByName?: string;
  specimenCode?: string;
  creatorId?: string;
  creationTime: string;
}

export interface CreateSpecimenHistoryDto {
  specimenId: string;
  action: string;
  location: string;
  status: SpecimenStatus;
  notes?: string;
  temperature?: number;
  humidity?: number;
  timestamp?: string;
  performedById?: string;
}

export interface UpdateSpecimenHistoryDto {
  action: string;
  location: string;
  status: SpecimenStatus;
  notes?: string;
  temperature?: number;
  humidity?: number;
  timestamp?: string;
  performedById?: string;
}
