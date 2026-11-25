// casinowar on the table — see table-casino.js.
import * as C from './casino-games.js?v=125';
import { casinoTable } from './table-casino.js?v=125';

export default casinoTable(C.casinowar, { id: 'casinowar' });
