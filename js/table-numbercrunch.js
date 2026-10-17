// Number Crunch on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=88';
import { quizTable } from './table-quiz.js?v=88';

export default quizTable(QUIZ.numbercrunch, { id: 'numbercrunch' });
