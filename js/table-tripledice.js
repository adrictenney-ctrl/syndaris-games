// tripledice on the table — see table-casino.js.
import * as C from './casino-games.js?v=95';
import { casinoTable } from './table-casino.js?v=95';

export default casinoTable(C.tripledice, { id: 'tripledice' });
