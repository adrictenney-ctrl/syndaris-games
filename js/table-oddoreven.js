// oddoreven on the table — see table-casino.js.
import * as C from './casino-games.js?v=88';
import { casinoTable } from './table-casino.js?v=88';

export default casinoTable(C.oddoreven, { id: 'oddoreven' });
