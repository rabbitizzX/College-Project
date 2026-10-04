declare module 'virtual:digital-saathi-survey-summary' {
  import type { processSurvey } from './data';

  const summary: ReturnType<typeof processSurvey>;
  export default summary;
}