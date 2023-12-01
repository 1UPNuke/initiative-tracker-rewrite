import { APIReference } from '../common/types';

export type EquipmentCategory = {
  equipment: APIReference[];
  index: string;
  name: string;
  url: string;
};
