// luckynumbers on the table — see table-casino.js.
import * as C from './casino-games.js?v=100';
import { casinoTable } from './table-casino.js?v=100';

export default casinoTable(C.luckynumbers, { id: 'luckynumbers' });
