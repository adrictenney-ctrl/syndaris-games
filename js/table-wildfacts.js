// Wild Facts on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=106';
import { quizTable } from './table-quiz.js?v=106';

export default quizTable(QUIZ.wildfacts, { id: 'wildfacts' });
