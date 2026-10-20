// luckynumbers on the table — see table-casino.js.
import * as C from './casino-games.js?v=97';
import { casinoTable } from './table-casino.js?v=97';

export default casinoTable(C.luckynumbers, { id: 'luckynumbers' });
