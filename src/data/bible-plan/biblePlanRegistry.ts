import { BiblePlanMonth, BiblePlanTemplate } from '../../models/BiblePlanModels';
import cronologicalData from './cronological-month.json';
import sixMonthsData from './six-months.json';
import threeMonthsData from './three-months.json';
import monthData from './year-month.json';
import yearData from './year.json';

const cronologicalMonths = cronologicalData as BiblePlanMonth[];
const monthPlan = monthData as BiblePlanMonth[];
const yearPlan = yearData as BiblePlanMonth[];
const threeMonthsPlan = threeMonthsData as BiblePlanMonth[];
const sixMonthsPlan = sixMonthsData as BiblePlanMonth[];

export const BIBLE_PLAN_TEMPLATES: BiblePlanTemplate[] = [
  {
    id: 'cronological-month-plan',
    title: 'Cronológica - Mês a Mês',
    description: 'Leitura cronológica dividida em meses.',
    icon: 'calendar',
    months: cronologicalMonths,
  },

  {
    id: 'three-months-plan',
    title: 'Clássica - 3 Meses',
    description: 'Toda a Bíblia em 3 meses.',
    icon: 'fast-forward',
    months: threeMonthsPlan,
  },
  {
    id: 'six-months-plan',
    title: 'Clássica - 6 Meses',
    description: 'Toda a Bíblia em 6 meses.',
    icon: 'play-circle',
    months: sixMonthsPlan,
  },
  {
    id: 'year-month-plan',
    title: 'Clássica - Mês a Mês',
    description: 'Leitura completa dividida em meses.',
    icon: 'book',
    months: monthPlan,
  },
  {
    id: 'year-plan',
    title: 'Clássica',
    description: 'Leitura da Bíblia dividida por ano.',
    icon: 'list',
    months: yearPlan,
  },
];

export function getBiblePlanTemplate(id: string): BiblePlanTemplate | undefined {
  return BIBLE_PLAN_TEMPLATES.find(t => t.id === id);
}
