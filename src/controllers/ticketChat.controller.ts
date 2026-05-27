import { Request, Response } from 'express';
import db from '../models';

const Ticket = db.Ticket as any;
const TicketMessage = db.TicketMessage as any;
const User = db.User as any;

const ACTIVE_STATUSES = ['Assigned L1', 'Assigned L2', 'Escalated'];

/**
 * GET /api/tickets/:id/messages
 * Returns all chat messages for a ticket, with sender name/role.
 */
export const getTicketMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = Number(req.params.id);

        const ticket = await Ticket.findByPk(ticketId, {
            attributes: ['id', 'status', 'company_user_id', 'assigned_to'],
        });

        if (!ticket) {
            res.status(404).json({ error: 'Ticket not found' });
            return;
        }

        const messages = await TicketMessage.findAll({
            where: { ticket_id: ticketId },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'role'],
                },
            ],
            order: [['created_at', 'ASC']],
        });

        res.json(messages);
    } catch (err) {
        console.error('Error fetching ticket messages:', err);
        res.status(500).json({ error: 'Failed to retrieve chat messages' });
    }
};

/**
 * POST /api/tickets/:id/messages
 * Sends a new message in the ticket chat.
 * Body: { senderId: number, message: string }
 */
export const sendTicketMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = Number(req.params.id);
        const { senderId, message, attachment_url } = req.body;

        if (!senderId || (!message && !attachment_url)) {
            res.status(400).json({ error: 'senderId and at least message or attachment_url are required' });
            return;
        }

        const ticket = await Ticket.findByPk(ticketId, {
            attributes: ['id', 'status', 'company_user_id', 'assigned_to'],
        });

        if (!ticket) {
            res.status(404).json({ error: 'Ticket not found' });
            return;
        }

        // Guard: chat is only allowed when ticket is active
        if (!ACTIVE_STATUSES.includes(ticket.status)) {
            res.status(403).json({
                error: `Chat is not available for tickets with status "${ticket.status}". Chat is only enabled for active tickets.`,
            });
            return;
        }

        // Guard: only the ticket owner (company_user_id) or the assigned agent (assigned_to) may send
        const numericSenderId = Number(senderId);
        const isOwner = ticket.company_user_id && ticket.company_user_id === numericSenderId;
        const isAssignee = ticket.assigned_to && ticket.assigned_to === numericSenderId;

        if (!isOwner && !isAssignee) {
            res.status(403).json({ error: 'You are not authorized to chat on this ticket' });
            return;
        }

        const saved = await TicketMessage.create({
            ticket_id: ticketId,
            sender_id: numericSenderId,
            message: message ? String(message).trim() : '',
            attachment_url: attachment_url || null,
        });

        // Return with sender info
        const full = await TicketMessage.findByPk(saved.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
        });

        res.status(201).json(full);
    } catch (err) {
        console.error('Error sending ticket message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
