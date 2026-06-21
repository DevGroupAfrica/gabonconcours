import {apiService} from '@/services/api';

type PaymentStatus = 'en_attente' | 'valide' | 'rejete';

interface PaymentRecord {
    statut?: PaymentStatus;
}

const sleep = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

export async function waitForPaymentConfirmation(
    nupcan: string,
    options: {attempts?: number; intervalMs?: number} = {}
): Promise<PaymentStatus> {
    const attempts = options.attempts ?? 20;
    const intervalMs = options.intervalMs ?? 3000;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (attempt > 0) await sleep(intervalMs);

        const response = await apiService.getPaiementByNupcan<PaymentRecord>(encodeURIComponent(nupcan));
        const status = response.data?.statut;

        if (status === 'valide' || status === 'rejete') return status;
    }

    return 'en_attente';
}
