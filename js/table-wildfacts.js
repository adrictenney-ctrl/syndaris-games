// Wild Facts on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=80';
import { quizTable } from './table-quiz.js?v=80';

export default quizTable(QUIZ.wildfacts, { id: 'wildfacts' });
