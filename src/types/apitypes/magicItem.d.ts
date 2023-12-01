import { APIReference } from '../common/types';

interface Rarity {
  _id?: boolean;
  name: string;
}

export type MagicItem = {
  desc: string[];
  equipment_category: APIReference;
  index: string;
  name: string;
  rarity: Rarity;
  url: string;
  variants: APIReference[];
  variant: boolean;
};
