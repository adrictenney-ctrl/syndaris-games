// Missing Vowels on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=101';
import { quizTable } from './table-quiz.js?v=101';

export default quizTable(QUIZ.missingvowels, { id: 'missingvowels' });
