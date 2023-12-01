import { APIReference } from '../common/types';

export type Skill = {
  ability_score: APIReference;
  desc: string[];
  index: string;
  name: string;
  url: string;
};
