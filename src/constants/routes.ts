export const ROUTES = {
  HOME: '/',
  BIBLE: '/bible',
  STUDIES: '/studies',
  CONFIGURATION: '/configuration',
  STUDY_EDITOR: (id: string) => `/studies/study/${id}` as const,
};
