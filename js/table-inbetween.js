// inbetween on the table — see table-casino.js.
import * as C from './casino-games.js?v=109';
import { casinoTable } from './table-casino.js?v=109';

export default casinoTable(C.inbetween, { id: 'inbetween' });
