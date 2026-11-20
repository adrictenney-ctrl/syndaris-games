// oddoreven on the table — see table-casino.js.
import * as C from './casino-games.js?v=118';
import { casinoTable } from './table-casino.js?v=118';

export default casinoTable(C.oddoreven, { id: 'oddoreven' });
