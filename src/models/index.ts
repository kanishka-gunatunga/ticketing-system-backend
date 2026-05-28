import { Sequelize } from 'sequelize';
import 'mysql2';
import dbConfig from '../config/db.config';
import { UserFactory } from './user.model';
import { CustomerFactory } from './customer.model';
import { ChatSessionFactory } from './chatSession.model';
import { ChatMessageFactory } from './chatMessage.model';
import { TicketFactory } from './ticket.model';
import { TicketActivityFactory } from './ticketActivity.model';
import { TicketFollowUpFactory } from './ticketFollowUp.model';
import { TicketReminderFactory } from './ticketReminder.model';
import { TicketMessageFactory } from './ticketMessage.model';

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect as any,
        pool: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle,
        },
        logging: false,
    }
);

const User = UserFactory(sequelize);
const Customer = CustomerFactory(sequelize);
const ChatSession = ChatSessionFactory(sequelize);
const ChatMessage = ChatMessageFactory(sequelize);
const Ticket = TicketFactory(sequelize);
const TicketActivity = TicketActivityFactory(sequelize);
const TicketFollowUp = TicketFollowUpFactory(sequelize);
const TicketReminder = TicketReminderFactory(sequelize);
const TicketMessage = TicketMessageFactory(sequelize);

// Associations

// Chat <-> Messages
(ChatSession as any).hasMany(ChatMessage, { foreignKey: 'chat_id', sourceKey: 'chat_id', as: 'messages' });
(ChatMessage as any).belongsTo(ChatSession, { foreignKey: 'chat_id', targetKey: 'chat_id', as: 'session' });

// Ticket Associations
(Ticket as any).belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
(Customer as any).hasMany(Ticket, { foreignKey: 'customer_id', as: 'tickets' });

(Ticket as any).belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
(User as any).hasMany(Ticket, { foreignKey: 'assigned_to', as: 'assigned_tickets' });

(Ticket as any).belongsTo(User, { foreignKey: 'company_user_id', as: 'companyCreator' });
(User as any).hasMany(Ticket, { foreignKey: 'company_user_id', as: 'company_tickets' });

(Ticket as any).hasMany(TicketActivity, { foreignKey: 'ticket_id', as: 'activities' });
(TicketActivity as any).belongsTo(Ticket, { foreignKey: 'ticket_id' });
(TicketActivity as any).belongsTo(User, { foreignKey: 'user_id', as: 'user' });
(User as any).hasMany(TicketActivity, { foreignKey: 'user_id', as: 'activities' });

(Ticket as any).hasMany(TicketFollowUp, { foreignKey: 'ticket_id', as: 'followups' });
(TicketFollowUp as any).belongsTo(Ticket, { foreignKey: 'ticket_id' });
(TicketFollowUp as any).belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

(Ticket as any).hasMany(TicketReminder, { foreignKey: 'ticket_id', as: 'reminders' });
(TicketReminder as any).belongsTo(Ticket, { foreignKey: 'ticket_id' });
(TicketReminder as any).belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Ticket Chat Messages
(Ticket as any).hasMany(TicketMessage, { foreignKey: 'ticket_id', as: 'chatMessages' });
(TicketMessage as any).belongsTo(Ticket, { foreignKey: 'ticket_id' });
(TicketMessage as any).belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Export the initialized models directly, NOT as typeof Class
const db = {
    Sequelize,
    sequelize,
    User,
    Customer,
    ChatSession,
    ChatMessage,
    Ticket,
    TicketActivity,
    TicketFollowUp,
    TicketReminder,
    TicketMessage
};

export default db;
