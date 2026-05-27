import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export interface TicketMessageAttributes {
    id: number;
    ticket_id: number;
    sender_id: number;
    message: string;
    attachment_url?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

interface TicketMessageCreationAttributes extends Optional<TicketMessageAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class TicketMessage extends Model<TicketMessageAttributes, TicketMessageCreationAttributes>
    implements TicketMessageAttributes {
    public id!: number;
    public ticket_id!: number;
    public sender_id!: number;
    public message!: string;
    public attachment_url?: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export const TicketMessageFactory = (sequelize: Sequelize) => {
    (TicketMessage as any).init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            ticket_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            sender_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            attachment_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'ticket_messages',
            timestamps: true,
            underscored: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        }
    );
    return TicketMessage;
};
