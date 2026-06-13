import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {CheckCircle, CreditCard, Smartphone, Clock, Phone} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import PaymentMethodLogo from './PaymentMethodLogos';

interface PaymentProcessorProps {
    montant: number;
    candidatureId: string; // Ce sera maintenant le NUPCAN
    onPaymentSuccess: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
                                                               montant,
                                                               candidatureId, // NUPCAN
                                                               onPaymentSuccess
                                                           }) => {
    const [processing, setProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'airtel' | 'moov' | 'virement'>('airtel');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validatePhoneNumber = (phone: string, method: 'airtel' | 'moov') => {
        const cleanPhone = phone.replace(/[\s+-]/g, '');

        if (!phone) {
            return 'Numéro de téléphone requis';
        }

        if (method === 'moov') {
            if (!/^(241)?(060|062|066)\d{6}$/.test(cleanPhone)) {
                return 'Numéro Moov invalide. Doit commencer par 060, 062 ou 066';
            }
        } else if (method === 'airtel') {
            if (!/^(241)?(074|076)\d{6}$/.test(cleanPhone)) {
                return 'Numéro Airtel invalide. Doit commencer par 074 ou 076';
            }
        }

        return null;
    };

    const handleMethodChange = (method: 'airtel' | 'moov' | 'virement') => {
        setSelectedMethod(method);
        setPhoneNumber('');
        setErrors({});
    };

    const handlePayment = async () => {
        setProcessing(true);
        setErrors({});

        try {
            // Validation pour les paiements mobile money
            if (selectedMethod !== 'virement') {
                const phoneError = validatePhoneNumber(phoneNumber, selectedMethod);
                if (phoneError) {
                    setErrors({phone: phoneError});
                    setProcessing(false);
                    return;
                }
            }

            console.log('Traitement du paiement pour NUPCAN:', candidatureId);

            // Créer le paiement en base de données avec NUPCAN
            const paiementResponse = await apiService.createPaiement({
                nupcan: candidatureId, // Utilise le NUPCAN complet
                montant: montant,
                methode: selectedMethod === 'airtel' ? 'airtel_money' : selectedMethod === 'moov' ? 'moov_money' : 'virement_bancaire',
                statut: 'valide', // Auto-validation pour démo
                numero_telephone: selectedMethod !== 'virement' ? phoneNumber : undefined,
            });

            console.log('Paiement créé:', paiementResponse);

            // Simuler un délai de traitement réaliste
            await new Promise(resolve => setTimeout(resolve, 3000));

            toast({
                title: "🎉 Paiement réussi !",
                description: `Votre paiement de ${montant.toLocaleString()} FCFA a été traité avec succès via ${selectedMethod === 'airtel' ? 'Airtel Money' : selectedMethod === 'moov' ? 'Moov Money' : 'Virement bancaire'}.`,
            });

            onPaymentSuccess();
        } catch (error) {
            console.error('Erreur de paiement:', error);
            toast({
                title: "❌ Erreur de paiement",
                description: "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const paymentMethods = [
        {
            id: 'airtel' as const,
            name: 'Airtel Money',
            description: 'Paiement via Airtel Money (074, 076)',
            icon: Smartphone,
            color: 'text-red-500',
            bgColor: 'bg-red-50 border-red-200',
            requiresPhone: true,
        },
        {
            id: 'moov' as const,
            name: 'Moov Money',
            description: 'Paiement via Moov Money (060, 062, 066)',
            icon: Smartphone,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 border-blue-200',
            requiresPhone: true,
        },
        {
            id: 'virement' as const,
            name: 'Virement Bancaire',
            description: 'Paiement par virement bancaire',
            icon: CreditCard,
            color: 'text-green-500',
            bgColor: 'bg-green-50 border-green-200',
            requiresPhone: false,
        },
    ];

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center justify-center space-x-2">
                    <CreditCard className="h-6 w-6 text-primary"/>
                    <span>Paiement Sécurisé</span>
                </CardTitle>
                <div className="text-center mt-4">
                    <div className="text-4xl font-bold text-primary mb-2">
                        {montant.toLocaleString()} FCFA
                    </div>
                    <p className="text-sm text-muted-foreground">Frais d'inscription</p>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Choisir une méthode de paiement</h4>

                    {paymentMethods.map((method) => (
                        <div key={method.id} className="space-y-3">
                            <button
                                onClick={() => handleMethodChange(method.id)}
                                className={`w-full p-4 border-2 rounded-lg transition-all hover:scale-[1.02] ${
                                    selectedMethod === method.id
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <PaymentMethodLogo method={method.id} size="md"/>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-lg">{method.name}</div>
                                        <div className="text-sm text-muted-foreground">{method.description}</div>
                                    </div>
                                    {selectedMethod === method.id && (
                                        <CheckCircle className="h-6 w-6 text-primary"/>
                                    )}
                                </div>
                            </button>

                            {/* Champ numéro de téléphone pour mobile money */}
                            {selectedMethod === method.id && method.requiresPhone && (
                                <div className="ml-4 space-y-2">
                                    <Label htmlFor="phone" className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2"/>
                                        Numéro de téléphone
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder={method.id === 'airtel' ? '074 XX XX XX' : '060 XX XX XX'}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className={errors.phone ? 'border-red-500' : ''}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-500">{errors.phone}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {method.id === 'airtel'
                                            ? 'Numéros Airtel commençant par 074 ou 076'
                                            : 'Numéros Moov commençant par 060, 062 ou 066'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Instructions pour virement */}
                            {selectedMethod === method.id && method.id === 'virement' && (
                                <div className="ml-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h5 className="font-semibold mb-2">Instructions de virement</h5>
                                    <div className="text-sm space-y-1">
                                        <p><strong>Banque:</strong> BGFI Bank Gabon</p>
                                        <p><strong>IBAN:</strong> GA21 4001 2000 0123 4567 8901 234</p>
                                        <p><strong>Code SWIFT:</strong> BGFIGALX</p>
                                        <p><strong>Référence:</strong> {candidatureId}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4">
                    <Button
                        onClick={handlePayment}
                        disabled={processing || (selectedMethod !== 'virement' && !phoneNumber)}
                        className="w-full gradient-bg text-white hover:opacity-90 py-3 text-lg"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <Clock className="h-5 w-5 mr-2 animate-spin"/>
                                Traitement en cours...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-5 w-5 mr-2"/>
                                Payer {montant.toLocaleString()} FCFA
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-center pt-4">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <CheckCircle className="h-3 w-3 mr-1"/>
                        Paiement 100% sécurisé
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                        Vos données sont protégées par un cryptage SSL 256 bits
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PaymentProcessor;
