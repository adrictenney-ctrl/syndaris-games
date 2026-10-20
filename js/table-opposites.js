// Opposites on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=95';
import { quizTable } from './table-quiz.js?v=95';

export default quizTable(QUIZ.opposites, { id: 'opposites' });
