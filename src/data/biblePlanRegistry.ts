import { BiblePlanMonth, BiblePlanTemplate } from '../models/BiblePlanModels';
import cronologicalData from './bible-plan/cronological-month.json';

const cronologicalMonths = cronologicalData as BiblePlanMonth[];

export const BIBLE_PLAN_TEMPLATES: BiblePlanTemplate[] = [
  {
    id: 'cronological-month',
    title: 'Leitura Cronológica Anual',
    description: 'Leitura cronológica da Bíblia organizada por meses com metas mensais.',
    icon: 'calendar',
    months: cronologicalMonths,
  },
];

export function getBiblePlanTemplate(id: string): BiblePlanTemplate | undefined {
  return BIBLE_PLAN_TEMPLATES.find(t => t.id === id);
}
