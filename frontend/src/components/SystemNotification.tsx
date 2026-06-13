import React, {useState, useEffect} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {X, Info, AlertTriangle, CheckCircle} from 'lucide-react';

interface SystemNotificationProps {
    type?: 'info' | 'warning' | 'success';
    title: string;
    message: string;
    dismissible?: boolean;
    autoHide?: boolean;
    duration?: number;
}

const SystemNotification: React.FC<SystemNotificationProps> = ({
                                                                   type = 'info',
                                                                   title,
                                                                   message,
                                                                   dismissible = true,
                                                                   autoHide = false,
                                                                   duration = 5000
                                                               }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (autoHide) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [autoHide, duration]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-600"/>;
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-600"/>;
            default:
                return <Info className="h-5 w-5 text-blue-600"/>;
        }
    };

    const getColorClasses = () => {
        switch (type) {
            case 'warning':
                return 'border-yellow-200 bg-yellow-50';
            case 'success':
                return 'border-green-200 bg-green-50';
            default:
                return 'border-blue-200 bg-blue-50';
        }
    };

    return (
        <Card className={`${getColorClasses()} mb-4`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        {getIcon()}
                        <div>
                            <h4 className="font-semibold text-gray-800">{title}</h4>
                            <p className="text-gray-600 mt-1">{message}</p>
                        </div>
                    </div>
                    {dismissible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsVisible(false)}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SystemNotification;
