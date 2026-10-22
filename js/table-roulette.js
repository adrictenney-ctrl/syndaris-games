// roulette on the table — see table-casino.js.
import * as C from './casino-games.js?v=111';
import { casinoTable } from './table-casino.js?v=111';

export default casinoTable(C.roulette, { id: 'roulette' });
