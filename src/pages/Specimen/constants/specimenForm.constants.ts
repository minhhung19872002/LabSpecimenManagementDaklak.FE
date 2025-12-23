import dayjs from 'dayjs';
import { SpecimenStatus } from '../../../types/specimen';

export const SPECIMEN_UNIT_OPTIONS = [
  { value: 'mL', label: 'mL' },
  { value: 'ống', label: 'Ống' },
  { value: 'tube', label: 'Tube' },
  { value: 'swab', label: 'Swab' },
  { value: 'mẫu', label: 'Mẫu' },
  { value: 'lọ', label: 'Lọ' },
  { value: 'slide', label: 'Slide' },
];

export const SPECIMEN_STATUS_OPTIONS = [
  { value: SpecimenStatus.Received, labelKey: 'specimen.status.received' },
  { value: SpecimenStatus.Testing, labelKey: 'specimen.status.testing' },
  { value: SpecimenStatus.Storage, labelKey: 'specimen.status.storage' },
  { value: SpecimenStatus.Disposal, labelKey: 'specimen.status.disposal' },
  { value: SpecimenStatus.Destroyed, labelKey: 'specimen.status.destroyed' },
  { value: SpecimenStatus.ReturnedToCustomer, labelKey: 'specimen.status.returnedToCustomer' },
];

export const SPECIMEN_FORM_INITIAL_VALUES = {
  receivedDate: dayjs(),
  quantity: 1,
  unit: 'Cái',
  status: SpecimenStatus.Received,
};

export const SPECIMEN_IMAGE_CONFIG = {
  maxCount: 10,
  accept: 'image/*',
  maxSize: 5,
  listType: 'picture-card' as const,
};

export const VALIDATION_RULES = {
  name: { max: 256 },
  type: { max: 256 },
  unit: { max: 50 },
  storageLocation: { max: 256 },
  deviation: { max: 1000 },
  notes: { max: 2000 },
};