import mongoose from 'mongoose';
import { APIReference } from '../common/types';

export type AbilityScore = {
  desc: string[];
  full_name: string;
  index: string;
  name: string;
  skills: APIReference[] | [];
  url: string;
};
