// True or False? on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=131';
import { quizTable } from './table-quiz.js?v=131';

export default quizTable(QUIZ.trueorfalse, { id: 'trueorfalse' });
