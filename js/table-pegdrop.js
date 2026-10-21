// pegdrop on the table — see table-casino.js.
import * as C from './casino-games.js?v=105';
import { casinoTable } from './table-casino.js?v=105';

export default casinoTable(C.pegdrop, { id: 'pegdrop' });
