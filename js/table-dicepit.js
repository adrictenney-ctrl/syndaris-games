// dicepit on the table — see table-casino.js.
import * as C from './casino-games.js?v=96';
import { casinoTable } from './table-casino.js?v=96';

export default casinoTable(C.dicepit, { id: 'dicepit' });
