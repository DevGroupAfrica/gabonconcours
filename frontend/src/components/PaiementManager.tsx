import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {CreditCard, Smartphone, Banknote} from 'lucide-react';
import {toast} from '@/hooks/use-toast';

interface PaiementManagerProps {
    montant: number;
    candidatureId: string;
    concours: any;
    candidatData: any;
    onPaymentSuccess: (paymentDetails: any) => void;
    paymentMethod: string;
}

const PaiementManager: React.FC<PaiementManagerProps> = ({
                                                             montant,
                                                             candidatureId,
                                                             concours,
                                                             candidatData,
                                                             onPaymentSuccess,
                                                             paymentMethod,
                                                         }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!montant || !candidatureId || !concours || !candidatData || !paymentMethod || !onPaymentSuccess) {
        return <div>Erreur : Données de paiement incomplètes</div>;
    }

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Simulation de traitement de paiement
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Données de paiement simulées avec les champs attendus
            const paymentDetails = {
                transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                amount: montant,
                method: paymentMethod,
                status: 'success',
                timestamp: new Date().toISOString(),
                candidatureId: candidatureId,
            };

            onPaymentSuccess(paymentDetails);
            toast({
                title: 'Paiement en cours',
                description: 'Votre paiement est en cours de traitement.',
            });
        } catch (error: any) {
            console.error('Erreur lors du paiement:', error);
            toast({
                title: 'Erreur de paiement',
                description: 'Une erreur s\'est produite lors du traitement du paiement.',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const renderPaymentForm = () => {
        switch (paymentMethod) {
            case 'mobile_money':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Entrez votre numéro de téléphone pour Mobile Money
                        </p>
                        <input
                            type="tel"
                            placeholder="Numéro de téléphone"
                            className="w-full p-2 border rounded-md"
                        />
                        <Button onClick={handlePayment} disabled={isProcessing} className="w-full">
                            {isProcessing ? 'Traitement...' : 'Payer avec Mobile Money'}
                        </Button>
                    </div>
                );
            case 'bank_card':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Entrez les détails de votre carte bancaire
                        </p>
                        <input
                            type="text"
                            placeholder="Numéro de carte"
                            className="w-full p-2 border rounded-md"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="MM/AA"
                                className="w-full p-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="CVC"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <Button onClick={handlePayment} disabled={isProcessing} className="w-full">
                            {isProcessing ? 'Traitement...' : 'Payer avec Carte Bancaire'}
                        </Button>
                    </div>
                );
            case 'bank_transfer':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Effectuez un virement bancaire avec les informations suivantes :
                        </p>
                        <p className="text-sm">
                            <strong>IBAN:</strong> GAB12345678901234567890
                        </p>
                        <p className="text-sm">
                            <strong>Référence:</strong> {candidatureId}
                        </p>
                        <Button onClick={handlePayment} disabled={isProcessing} className="w-full">
                            {isProcessing ? 'Traitement...' : 'Confirmer le virement'}
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                    {paymentMethod === 'mobile_money' && <Smartphone className="h-6 w-6 mr-2"/>}
                    {paymentMethod === 'bank_card' && <CreditCard className="h-6 w-6 mr-2"/>}
                    {paymentMethod === 'bank_transfer' && <Banknote className="h-6 w-6 mr-2"/>}
                    <h3 className="text-lg font-semibold">
                        Paiement de {montant.toLocaleString()} FCFA
                    </h3>
                </div>
                {renderPaymentForm()}
            </CardContent>
        </Card>
    );
};

export default PaiementManager;