import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface TicketAttributes {
    id: number;
    ticket_number: string; // e.g., TKT-123456
    title: string;
    product: string; // e.g., DMS, HRIS
    instant_id: string; // e.g., HNBLife
    status: 'New' | 'Assigned L1' | 'Escalated' | 'Assigned L2' | 'Resolved' | 'Closed';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    category: 'Technical Issue' | 'Bug Report' | 'Login & Access' | 'Feature Request' | 'Data Issue' | 'UI/UX Issue' | 'Security Issue' | 'Other';
    description: string;
    requester_name: string;
    requester_email: string;
    requester_phone: string;
    requester_department?: string;
    requester_branch?: string;
    impact_level?: 'Single User' | 'Department' | 'Branch' | 'Entire Company';
    impact_user_details?: string;
    attachments?: string; // Stored as a simple URL or JSON string
    customer_id?: number; // Kept for schema compatibility
    company_user_id?: number; // User ID of the Company user
    assigned_to?: number; // User ID (Agent)
    created_at?: Date;
    updated_at?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'status' | 'priority' | 'requester_department' | 'requester_branch' | 'impact_level' | 'impact_user_details' | 'attachments' | 'customer_id' | 'company_user_id' | 'assigned_to' | 'created_at' | 'updated_at'> { }

export class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
    public id!: number;
    public ticket_number!: string;
    public title!: string;
    public product!: string;
    public instant_id!: string;
    public status!: 'New' | 'Assigned L1' | 'Escalated' | 'Assigned L2' | 'Resolved' | 'Closed';
    public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
    public category!: 'Technical Issue' | 'Bug Report' | 'Login & Access' | 'Feature Request' | 'Data Issue' | 'UI/UX Issue' | 'Security Issue' | 'Other';
    public description!: string;
    public requester_name!: string;
    public requester_email!: string;
    public requester_phone!: string;
    public requester_department?: string;
    public requester_branch?: string;
    public impact_level?: 'Single User' | 'Department' | 'Branch' | 'Entire Company';
    public impact_user_details?: string;
    public attachments?: string;
    public customer_id?: number;
    public company_user_id?: number;
    public assigned_to?: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export const TicketFactory = (sequelize: Sequelize) => {
    (Ticket as any).init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            ticket_number: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Support Inquiry',
            },
            product: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            instant_id: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('New', 'Assigned L1', 'Escalated', 'Assigned L2', 'Resolved', 'Closed'),
                defaultValue: 'New',
            },
            priority: {
                type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
                defaultValue: 'Medium',
            },
            category: {
                type: DataTypes.ENUM('Technical Issue', 'Bug Report', 'Login & Access', 'Feature Request', 'Data Issue', 'UI/UX Issue', 'Security Issue', 'Other'),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            requester_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            requester_email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            requester_phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            requester_department: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            requester_branch: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            impact_level: {
                type: DataTypes.ENUM('Single User', 'Department', 'Branch', 'Entire Company'),
                allowNull: true,
            },
            impact_user_details: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            attachments: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            customer_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },
            company_user_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },
            assigned_to: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            }
        },
        {
            sequelize,
            tableName: 'tickets',
            timestamps: true,
            underscored: true,
        }
    );
    return Ticket;
};
