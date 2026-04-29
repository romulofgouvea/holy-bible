export const ROUTES = {
  HOME: '/',
  BIBLE: '/bible',
  STUDIES: '/studies',
  CONFIGURATION: '/configuration',
  SEARCH: '/search',
  STUDY_EDITOR: (id: string) => `/studies/study/${id}` as const,
};
