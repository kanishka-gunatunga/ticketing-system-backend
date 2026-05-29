import { Router } from 'express';
import {
    listTickets,
    createTicket,
    updateTicket,
    getTicketDetails,
    assignTicket,
    escalateTicket,
    adminAssignAgent,
    remindTicket
} from '../controllers/ticket.controller';
import { getTicketMessages, sendTicketMessage } from '../controllers/ticketChat.controller';

const router = Router();

router.get('/', listTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.get('/:id', getTicketDetails);
router.post('/:id/assign', assignTicket);
router.post('/:id/escalate', escalateTicket);
router.post('/:id/admin-assign', adminAssignAgent);
router.post('/:id/remind', remindTicket);
router.get('/:id/messages', getTicketMessages);
router.post('/:id/messages', sendTicketMessage);

export default router;
