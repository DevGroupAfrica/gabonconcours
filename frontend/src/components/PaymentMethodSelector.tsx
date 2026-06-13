import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Smartphone } from 'lucide-react';

interface PaymentMethod {
    id: string;
    name: string;
    icon?: string;
    description?: string;
}

const paymentMethods: PaymentMethod[] = [
    {
        id: 'airtel_money',
        name: 'Airtel Money',
        description: 'Payer avec Airtel Money',
    },
    {
        id: 'moov_money',
        name: 'Moov Money',
        description: 'Payer avec Moov Money',
    },
];

interface PaymentMethodSelectorProps {
    selectedMethod: string;
    onMethodChange: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    selectedMethod,
    onMethodChange,
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Méthode de paiement</h3>
            <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
                <div className="grid gap-4">
                    {paymentMethods.map((method) => (
                        <Card
                            key={method.id}
                            className={`cursor-pointer transition-all ${
                                selectedMethod === method.id
                                    ? 'border-primary ring-2 ring-primary'
                                    : 'hover:border-primary/50'
                            }`}
                            onClick={() => onMethodChange(method.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-4">
                                    <RadioGroupItem value={method.id} id={method.id} />
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Smartphone className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <Label
                                                htmlFor={method.id}
                                                className="text-base font-semibold cursor-pointer"
                                            >
                                                {method.name}
                                            </Label>
                                            {method.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {method.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </RadioGroup>
        </div>
    );
};

export default PaymentMethodSelector;
