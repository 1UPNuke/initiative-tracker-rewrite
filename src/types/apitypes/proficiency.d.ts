import { APIReference } from '../common/types';

type Reference = {
  _id: false;
  index: string;
  name: string;
  type: string;
  url: string;
};

export type Proficiency = {
  classes?: APIReference[];
  index: string;
  name: string;
  races?: APIReference[];
  reference: Reference;
  type: string;
  url: string;
};
