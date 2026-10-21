// inbetween on the table — see table-casino.js.
import * as C from './casino-games.js?v=106';
import { casinoTable } from './table-casino.js?v=106';

export default casinoTable(C.inbetween, { id: 'inbetween' });
