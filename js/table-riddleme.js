// Riddle Me This on the table — the quiz-show screen (see table-quiz.js).
import { QUIZ } from './quiz-games.js?v=68';
import { quizTable } from './table-quiz.js?v=68';

export default quizTable(QUIZ.riddleme, { id: 'riddleme' });
