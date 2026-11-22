// tripledice on the table — see table-casino.js.
import * as C from './casino-games.js?v=120';
import { casinoTable } from './table-casino.js?v=120';

export default casinoTable(C.tripledice, { id: 'tripledice' });
