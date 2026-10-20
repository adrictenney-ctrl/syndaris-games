// tripledice on the table — see table-casino.js.
import * as C from './casino-games.js?v=101';
import { casinoTable } from './table-casino.js?v=101';

export default casinoTable(C.tripledice, { id: 'tripledice' });
