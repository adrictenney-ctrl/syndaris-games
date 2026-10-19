// pegdrop on the table — see table-casino.js.
import * as C from './casino-games.js?v=91';
import { casinoTable } from './table-casino.js?v=91';

export default casinoTable(C.pegdrop, { id: 'pegdrop' });
