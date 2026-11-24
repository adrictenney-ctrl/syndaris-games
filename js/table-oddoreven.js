// oddoreven on the table — see table-casino.js.
import * as C from './casino-games.js?v=122';
import { casinoTable } from './table-casino.js?v=122';

export default casinoTable(C.oddoreven, { id: 'oddoreven' });
