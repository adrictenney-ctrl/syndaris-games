// PowerUp Chess on the table: the chess board and controls, running the stacking engine.
// Absorbed pieces show in a strip under the piece on top.
import * as P from './powerchess.js?v=65';
import { withEngine } from './table-chess.js?v=65';

export default withEngine(P);
