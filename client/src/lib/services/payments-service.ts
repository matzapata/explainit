

import { apiService } from "@/lib/services/api-service"
import { AxiosInstance } from "axios"

export interface SubscriptionPlan {
    name: string;
    variantId: string | null;
    interval: 'month' | 'year' | 'lifetime';
    price: number;
    description: string;
    features: string[];
    limits: {
        maxDocuments: number;
        maxMessages: number;
    };
}
export enum SubscriptionPlanKey {
    FREE = "free",
    PRO = "pro"
}

export class PaymentsService {

    constructor(private readonly client: AxiosInstance) { }

    async getPlans(): Promise<Record<SubscriptionPlanKey, SubscriptionPlan>> {
        const res = await this.client.get('/api/payments/plans')
        return res.data
    }

    async createCheckout(accessToken: string): Promise<string> {
        const res = await this.client.post('/api/payments/subscription', {}, { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data.url
    }

    async getSubscription(accessToken: string): Promise<{
        id: string;
        email: string;
        name?: string;
        subscription: any,
        plan: SubscriptionPlan,
        isPro: boolean
    }> {
        const res = await this.client.get('/api/payments/subscription', { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data
    }

    async createPortal(accessToken: string): Promise<string> {
        const res = await this.client.get('/api/payments/subscription/portal', { headers: { Authorization: `Bearer ${accessToken}` } })
        return res.data.url
    }
}

export const paymentsService = new PaymentsService(apiService.client)