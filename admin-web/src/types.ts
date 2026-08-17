export type RoleCode = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'RECEPTION' | 'SALES' | 'MAKEUP' | 'PHOTOGRAPHER' | 'RETOUCHER';
export interface Profile { id: string; username: string; phone?: string; role: RoleCode; merchant: null | { id: string; name: string; merchantCode: string; plan: string; expireAt?: string; status: string }; employee: null | { id: string; name: string; store?: string }; stats: { storeCount: number; employeeCount: number } }
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }
export interface Store { id: string; name: string; address?: string; contactPhone?: string; status: 'ACTIVE' | 'DISABLED'; createdAt: string }
export interface Employee { id: string; name: string; phone: string; role: RoleCode; status: 'ACTIVE' | 'DISABLED'; joinDate?: string; storeId?: string; store?: Store }
export interface Merchant { id: string; name: string; merchantCode: string; contactName?: string; contactPhone?: string; status: string; plan: string; expireAt?: string; createdAt: string; _count: { stores: number; employees: number } }
export type OrderStatus = 'PENDING_CONFIRMATION'|'WAITING_MAKEUP'|'MAKEUP_IN_PROGRESS'|'WAITING_PHOTOGRAPHY'|'PHOTOGRAPHY_IN_PROGRESS'|'WAITING_SELECTION'|'WAITING_RETOUCH'|'COMPLETED'|'CANCELLED';
export type ServiceStage = 'MAKEUP'|'PHOTOGRAPHY';
export interface ServiceRecord { id:string; stage:ServiceStage; status:'CLAIMED'|'IN_PROGRESS'|'COMPLETED'|'REPLACED'; isCurrent:boolean; employeeId:string; employee:Employee; claimedAt:string; startedAt?:string; completedAt?:string; replacementReason?:string }
export interface ValueAddedService { id:string; stage:ServiceStage; name:string; quantity:number; unitAmount:string; totalAmount:string; status:'PENDING'|'CONFIRMED'|'DISPUTED'|'VOIDED'; description?:string; customerNote?:string; employee:Employee; createdAt:string }
export interface Order { id:string; orderNo:string; accessToken:string; status:OrderStatus; packageName?:string; appointmentAt?:string; notes?:string; selectionConfirmedAt?:string; createdAt:string; customer:{id:string;name:string;phone:string}; store:Store; serviceRecords:ServiceRecord[]; valueAddedServices:ValueAddedService[] }
