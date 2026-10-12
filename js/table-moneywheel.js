// moneywheel on the table — see table-casino.js.
import * as C from './casino-games.js?v=85';
import { casinoTable } from './table-casino.js?v=85';

export default casinoTable(C.moneywheel, { id: 'moneywheel' });
