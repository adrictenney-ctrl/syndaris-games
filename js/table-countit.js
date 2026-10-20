// Count It on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=100';
import { quizTable } from './table-quiz.js?v=100';

export default quizTable(QUIZ.countit, { id: 'countit' });
