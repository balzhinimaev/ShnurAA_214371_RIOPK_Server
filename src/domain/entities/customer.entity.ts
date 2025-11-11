// src/domain/entities/customer.entity.ts
export class Customer {
    public readonly id: string;
    public name: string;
    public unp?: string;
    public contactInfo?: string;
    public totalDebt?: number; // Эти поля не хранятся в БД, а рассчитываются
    public overdueDebt?: number; // Эти поля не хранятся в БД, а рассчитываются
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(props: {
        id: string;
        name: string;
        unp?: string;
        contactInfo?: string;
        totalDebt?: number;
        overdueDebt?: number;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this.id = props.id;
        this.name = props.name;
        this.unp = props.unp;
        this.contactInfo = props.contactInfo;
        this.totalDebt = props.totalDebt;
        this.overdueDebt = props.overdueDebt;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
