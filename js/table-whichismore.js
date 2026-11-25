// Which Is More? on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=124';
import { quizTable } from './table-quiz.js?v=124';

export default quizTable(QUIZ.whichismore, { id: 'whichismore' });
