import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface UserAttributes {
    id: number;
    name: string;
    full_name?: string;
    email: string;
    role: 'Admin' | 'Company' | 'AgentL1' | 'AgentL2';
    password_hash?: string;
    contact_no?: string;
    products?: string[]; // e.g. ["DMS", "HRIS"]
    instant_ids?: Record<string, string>; // e.g. {"DMS": "HNBLife"}
    is_online: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'full_name' | 'password_hash' | 'contact_no' | 'products' | 'instant_ids' | 'is_online' | 'created_at' | 'updated_at'> { }

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public name!: string;
    public full_name?: string;
    public email!: string;
    public role!: 'Admin' | 'Company' | 'AgentL1' | 'AgentL2';
    public password_hash?: string;
    public contact_no?: string;
    public products?: string[];
    public instant_ids?: Record<string, string>;
    public is_online!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export const UserFactory = (sequelize: Sequelize) => {
    (User as any).init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            full_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            role: {
                type: DataTypes.ENUM('Admin', 'Company', 'AgentL1', 'AgentL2'),
                defaultValue: 'AgentL1',
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            contact_no: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            products: {
                type: DataTypes.JSON,
                allowNull: true,
                get() {
                    const rawValue = this.getDataValue('products');
                    if (!rawValue) return [];
                    if (typeof rawValue === 'string') {
                        try {
                            return JSON.parse(rawValue);
                        } catch {
                            return [];
                        }
                    }
                    return rawValue;
                },
                set(value) {
                    this.setDataValue('products', value ? (typeof value === 'string' ? value : JSON.stringify(value)) : null);
                }
            },
            instant_ids: {
                type: DataTypes.JSON,
                allowNull: true,
                get() {
                    const rawValue = this.getDataValue('instant_ids');
                    if (!rawValue) return {};
                    if (typeof rawValue === 'string') {
                        try {
                            return JSON.parse(rawValue);
                        } catch {
                            return {};
                        }
                    }
                    return rawValue;
                },
                set(value) {
                    this.setDataValue('instant_ids', value ? (typeof value === 'string' ? value : JSON.stringify(value)) : null);
                }
            },
            is_online: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            }
        },
        {
            sequelize,
            tableName: 'users',
            timestamps: true,
            underscored: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        }
    );
    return User;
};
