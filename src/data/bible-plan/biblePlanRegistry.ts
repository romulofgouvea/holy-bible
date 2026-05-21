import { BiblePlanMonth, BiblePlanTemplate } from '../../models/BiblePlanModels';
import cronologicalData from './cronological-month.json';
import monthData from './year-month.json';
import yearData from './year.json';

const cronologicalMonths = cronologicalData as BiblePlanMonth[];
const monthPlan = monthData as BiblePlanMonth[];
const yearPlan = yearData as BiblePlanMonth[];

export const BIBLE_PLAN_TEMPLATES: BiblePlanTemplate[] = [
  {
    id: 'year-plan',
    title: 'Clássica',
    description: 'Leitura da Bíblia dividida por ano.',
    icon: 'list',
    months: yearPlan,
  },
  {
    id: 'year-month-plan',
    title: 'Clássica - Mês a Mês',
    description: 'Leitura completa dividida em meses.',
    icon: 'book',
    months: monthPlan,
  },
  {
    id: 'cronological-month-plan',
    title: 'Cronológica - Mês a Mês',
    description: 'Leitura cronológica dividida em meses.',
    icon: 'calendar',
    months: cronologicalMonths,
  }
];

export function getBiblePlanTemplate(id: string): BiblePlanTemplate | undefined {
  return BIBLE_PLAN_TEMPLATES.find(t => t.id === id);
}
