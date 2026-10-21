// Wild Facts on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=103';
import { quizTable } from './table-quiz.js?v=103';

export default quizTable(QUIZ.wildfacts, { id: 'wildfacts' });
