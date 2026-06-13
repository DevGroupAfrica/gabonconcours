import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { mypvitService, MyPVITPaymentRequest } from '@/services/mypvitService';
import { Loader2, Smartphone, CheckCircle2 } from 'lucide-react';

interface MyPVITPaymentProps {
    nupcan: string;
    montant: number;
    candidat_id?: number;
    concours_id?: number;
    onSuccess?: () => void;
}

const MyPVITPayment: React.FC<MyPVITPaymentProps> = ({
    nupcan,
    montant,
    candidat_id,
    concours_id,
    onSuccess
}) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [ussdCode, setUssdCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || phoneNumber.length < 8) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer un numéro de téléphone valide',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);

        try {
            const paymentData: MyPVITPaymentRequest = {
                nupcan,
                montant,
                numero_telephone: phoneNumber,
                candidat_id,
                concours_id
            };

            const response = await mypvitService.initPayment(paymentData);

            if (response.success) {
                setPaymentInitiated(true);
                
                if (response.data?.ussd_code) {
                    setUssdCode(response.data.ussd_code);
                }

                toast({
                    title: 'Paiement initié',
                    description: 'Vérifiez votre téléphone pour confirmer le paiement',
                });

                // Vérifier le statut après 5 secondes
                if (response.data?.transaction_id) {
                    setTimeout(() => {
                        checkStatus(response.data!.transaction_id!);
                    }, 5000);
                }
            } else {
                toast({
                    title: 'Erreur',
                    description: response.message,
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Erreur paiement MyPVIT:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible d\'initier le paiement',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async (transactionId: string) => {
        try {
            const statusResponse = await mypvitService.checkPaymentStatus(transactionId);
            
            if (statusResponse.status === 'success' || statusResponse.status === 'completed') {
                toast({
                    title: 'Paiement réussi',
                    description: 'Votre paiement a été confirmé',
                });
                onSuccess?.();
            }
        } catch (error) {
            console.error('Erreur vérification statut:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Paiement MyPVIT (Mobile Money)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!paymentInitiated ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="montant">Montant à payer</Label>
                            <Input
                                id="montant"
                                type="text"
                                value={`${montant.toLocaleString()} FCFA`}
                                disabled
                                className="font-semibold"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone">Numéro de téléphone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Ex: 077123456"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Format: 0XXXXXXXX (Airtel, Moov, Gabon Telecom)
                            </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Initialisation...
                                </>
                            ) : (
                                <>
                                    <Smartphone className="mr-2 h-4 w-4" />
                                    Payer {montant.toLocaleString()} FCFA
                                </>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="text-lg font-semibold">Paiement initié</h3>
                        
                        {ussdCode && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">Code USSD:</p>
                                <p className="text-2xl font-bold">{ussdCode}</p>
                            </div>
                        )}
                        
                        <p className="text-sm text-muted-foreground">
                            Vérifiez votre téléphone ({phoneNumber}) pour confirmer le paiement.
                            Vous recevrez une notification une fois le paiement confirmé.
                        </p>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setPaymentInitiated(false);
                                setPhoneNumber('');
                            }}
                        >
                            Nouveau paiement
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MyPVITPayment;
