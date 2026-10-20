// pegdrop on the table — see table-casino.js.
import * as C from './casino-games.js?v=93';
import { casinoTable } from './table-casino.js?v=93';

export default casinoTable(C.pegdrop, { id: 'pegdrop' });
