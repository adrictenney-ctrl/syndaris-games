// Which Is More? on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=90';
import { quizTable } from './table-quiz.js?v=90';

export default quizTable(QUIZ.whichismore, { id: 'whichismore' });
