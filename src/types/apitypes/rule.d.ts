import { APIReference } from '../common/types';

export type Rule = {
  desc: string;
  index: string;
  name: string;
  subsections: APIReference[];
  url: string;
};
