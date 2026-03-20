export const ROUTES = {
  HOME: '/',
  BIBLE: '/bible',
  STUDIES: '/studies',
  STUDY_EDITOR: (id: string) => `/studies/study/${id}` as const,
};
