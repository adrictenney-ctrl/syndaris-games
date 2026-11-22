// Opposites on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=120';
import { quizTable } from './table-quiz.js?v=120';

export default quizTable(QUIZ.opposites, { id: 'opposites' });
