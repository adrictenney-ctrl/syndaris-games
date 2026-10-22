// Doesn’t Belong on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=111';
import { quizTable } from './table-quiz.js?v=111';

export default quizTable(QUIZ.doesntbelong, { id: 'doesntbelong' });
