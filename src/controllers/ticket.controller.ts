import { Request, Response } from 'express';
import db from '../models';
import { Op } from 'sequelize';
import { emailService } from '../services/email.service';
import { z } from 'zod';

const Ticket = db.Ticket as any;
const User = db.User as any;
const TicketActivity = db.TicketActivity as any;
const TicketFollowUp = db.TicketFollowUp as any;
const TicketReminder = db.TicketReminder as any;

const createTicketSchema = z.object({
    title: z.string().min(1, "Title is required"),
    product: z.string().min(1, "Product is required"),
    instant_id: z.string().min(1, "Instant ID is required"),
    category: z.enum(['Technical Issue', 'Bug Report', 'Login & Access', 'Feature Request', 'Data Issue', 'UI/UX Issue', 'Security Issue', 'Other']),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    description: z.string().min(1, "Description is required"),
    requester_name: z.string().min(1, "Requester name is required"),
    requester_email: z.string().email("Invalid email address"),
    requester_phone: z.string().min(10, "Phone number must be at least 10 digits"),
    requester_department: z.string().optional().or(z.literal("")),
    requester_branch: z.string().optional().or(z.literal("")),
    impact_level: z.enum(['Single User', 'Department', 'Branch', 'Entire Company']).optional().or(z.literal("")),
    impact_user_details: z.string().optional().or(z.literal("")),
    attachments: z.string().optional().or(z.literal("")),
    company_user_id: z.number().optional()
});

// List Tickets filtered by User Role
export const listTickets = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, userId, status, priority, assignee } = req.query;
        const where: any = {};

        // Parse query params safely
        const userRole = role as string;
        const currentUserId = userId ? Number(userId) : null;

        // Apply filters
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignee) where.assigned_to = assignee;

        // Role-based visibility
        if (userRole === 'Company' && currentUserId) {
            where.company_user_id = currentUserId;
        } else if (userRole === 'AgentL1') {
            // L1 Agents see unassigned new tickets OR tickets assigned to them specifically
            where[Op.or] = [
                { status: 'New' },
                {
                    [Op.and]: [
                        { assigned_to: currentUserId },
                        { status: 'Assigned L1' }
                    ]
                }
            ];
        } else if (userRole === 'AgentL2') {
            // L2 Agents see escalated unassigned tickets OR tickets assigned to them specifically
            where[Op.or] = [
                { status: 'Escalated' },
                {
                    [Op.and]: [
                        { assigned_to: currentUserId },
                        { status: 'Assigned L2' }
                    ]
                }
            ];
        }

        const tickets = await Ticket.findAll({
            where,
            include: [
                { model: User, as: 'companyCreator', attributes: ['id', 'name', 'email', 'contact_no'] },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.json(tickets);
    } catch (error: any) {
        console.error("List Tickets Error:", error);
        res.status(500).json({ message: "Error fetching tickets", error: error.message });
    }
};

// Create Ticket
export const createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const validationResult = createTicketSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                message: "Validation Error",
                errors: validationResult.error.format()
            });
            return;
        }

        const data = validationResult.data;

        // Generate clean unique ticket number
        const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

        const ticket = await Ticket.create({
            ticket_number: ticketNumber,
            title: data.title,
            product: data.product,
            instant_id: data.instant_id,
            status: 'New',
            priority: data.priority,
            category: data.category,
            description: data.description,
            requester_name: data.requester_name,
            requester_email: data.requester_email,
            requester_phone: data.requester_phone,
            requester_department: data.requester_department || undefined,
            requester_branch: data.requester_branch || undefined,
            impact_level: data.impact_level || undefined,
            impact_user_details: data.impact_user_details || undefined,
            attachments: data.attachments || undefined,
            company_user_id: data.company_user_id || undefined
        });

        // Record creation in history activity log
        await TicketActivity.create({
            ticket_id: ticket.id,
            user_id: data.company_user_id,
            activity_type: 'Log',
            details: `Support Inquiry created by requester ${data.requester_name} (${data.requester_email})`
        });

        // Send Confirmation Email
        if (data.requester_email) {
            await emailService.sendTicketConfirmation(data.requester_email, ticket.ticket_number, data.requester_name);
        }

        res.status(201).json(ticket);
    } catch (error: any) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ message: "Error creating ticket", error: error.message });
    }
};

// Update Ticket & Record Status Transition
export const updateTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const ticketId = Number(id);
        const { status, priority, description, note, userId } = req.body;

        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            res.status(404).json({ message: "Ticket not found" });
            return;
        }

        const previousStatus = ticket.status;

        // Perform updates
        await Ticket.update(req.body, { where: { id: ticketId } });
        const updatedTicket = await Ticket.findByPk(ticketId);

        // If status has changed, log activity
        if (status && previousStatus !== status) {
            await TicketActivity.create({
                ticket_id: ticketId,
                user_id: userId ? Number(userId) : undefined,
                activity_type: 'Status Change',
                details: `Status updated from "${previousStatus}" to "${status}"`
            });
        }

        res.json(updatedTicket);
    } catch (error: any) {
        res.status(500).json({ message: "Error updating ticket", error: error.message });
    }
};

// Get Ticket Details with full Creator, Assignee and Activity logs history
export const getTicketDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findByPk(Number(id), {
            include: [
                { model: User, as: 'companyCreator', attributes: ['id', 'name', 'email', 'contact_no'] },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
                {
                    model: TicketActivity,
                    as: 'activities',
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role'] }]
                },
                {
                    model: TicketFollowUp,
                    as: 'followups',
                    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
                },
                {
                    model: TicketReminder,
                    as: 'reminders',
                    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
                }
            ]
        });

        if (!ticket) {
            res.status(404).json({ message: "Ticket not found" });
            return;
        }
        res.json(ticket);
    } catch (error: any) {
        res.status(500).json({ message: "Error retrieving ticket", error: error.message });
    }
};

// Self Assign Ticket ("Assign to me")
export const assignTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { agentId } = req.body;

        const ticket = await Ticket.findByPk(Number(id));
        if (!ticket) {
            res.status(404).json({ message: "Ticket not found" });
            return;
        }

        const agent = await User.findByPk(Number(agentId));
        if (!agent) {
            res.status(404).json({ message: "Agent not found" });
            return;
        }

        // Determine new status based on agent role
        const newStatus = agent.role === 'AgentL2' ? 'Assigned L2' : 'Assigned L1';

        await ticket.update({
            assigned_to: agent.id,
            status: newStatus
        });

        // Log self-assignment
        await TicketActivity.create({
            ticket_id: ticket.id,
            user_id: agent.id,
            activity_type: 'Log',
            details: `Ticket self-assigned to ${agent.name} (${agent.role})`
        });

        res.json({ message: "Ticket assigned successfully", ticket });
    } catch (error: any) {
        console.error("Assign Ticket Error:", error);
        res.status(550).json({ message: "Error assigning ticket", error: error.message });
    }
};

// Escalate Ticket L1 -> L2
export const escalateTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { agentId } = req.body; // Agent L1 performing the escalation

        const ticket = await Ticket.findByPk(Number(id));
        if (!ticket) {
            res.status(404).json({ message: "Ticket not found" });
            return;
        }

        const l1Agent = agentId ? await User.findByPk(Number(agentId)) : null;
        const agentName = l1Agent ? l1Agent.name : "Agent L1";

        // Escalate status and clear active assignee so L2 agents see it unassigned
        await ticket.update({
            status: 'Escalated',
            assigned_to: null
        });

        // Log escalation in history timeline
        await TicketActivity.create({
            ticket_id: ticket.id,
            user_id: agentId ? Number(agentId) : undefined,
            activity_type: 'Log',
            details: `Ticket escalated to Level 2 queue by ${agentName}. Cleared L1 assignee.`
        });

        res.json({ message: "Ticket escalated successfully", ticket });
    } catch (error: any) {
        console.error("Escalate Ticket Error:", error);
        res.status(500).json({ message: "Error escalating ticket", error: error.message });
    }
};

// Admin Agent Assignment
export const adminAssignAgent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { agentId, adminId } = req.body;

        const ticket = await Ticket.findByPk(Number(id));
        if (!ticket) {
            res.status(404).json({ message: "Ticket not found" });
            return;
        }

        const agent = await User.findByPk(Number(agentId));
        if (!agent) {
            res.status(404).json({ message: "Agent not found" });
            return;
        }

        const newStatus = agent.role === 'AgentL2' ? 'Assigned L2' : 'Assigned L1';

        await ticket.update({
            assigned_to: agent.id,
            status: newStatus
        });

        // Log admin assign action in timeline
        await TicketActivity.create({
            ticket_id: ticket.id,
            user_id: adminId ? Number(adminId) : undefined,
            activity_type: 'Log',
            details: `Agent ${agent.name} manually assigned to ticket by Administrator`
        });

        res.json({ message: "Agent assigned by Admin successfully", ticket });
    } catch (error: any) {
        console.error("Admin Assign Error:", error);
        res.status(500).json({ message: "Error in Admin assignment", error: error.message });
    }
};
