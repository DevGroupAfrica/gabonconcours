import React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {GraduationCap, CheckCircle, Users, TrendingUp} from 'lucide-react';
import {useHomeStatistics} from '@/hooks/useHomeStatistics';
import {Button} from "@/components/ui/button.tsx";
import {useNavigate} from "react-router-dom";

const StatsSection = () => {
    const {data: stats, isLoading} = useHomeStatistics();
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        navigate(path);
    };
    const statisticsData = [
        {
            icon: GraduationCap,
            value: isLoading ? '...' : stats?.totalConcours || '25',
            label: 'Concours Disponibles',
            sublabel: `${isLoading ? '18' : stats?.concoursActifs || '18'} actuellement ouverts`,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50'
        },
        {
          icon: CheckCircle,
          value: isLoading ? '...' : stats?.concoursGratuits || '12',
          label: 'Concours Gorri',
          sublabel: '100% Gratuits',
          color: 'text-green-500',
          bgColor: 'bg-green-50'
        },
        {
          icon: Users,
          value: isLoading ? '...' : stats?.candidatsInscrits?.toLocaleString() || '2,847',
          label: 'Candidats Inscrits',
          sublabel: 'Cette année',
          color: 'text-orange-500',
          bgColor: 'bg-orange-50'
        },
        {
          icon: TrendingUp,
          value: isLoading ? '...' : `${stats?.tauxReussite || 85}%`,
          label: 'Taux de Réussite',
          sublabel: 'Moyenne générale',
          color: 'text-purple-500',
          bgColor: 'bg-purple-50'
        }
    ];

    return (
        <section className="py-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {statisticsData.map((stat, index) => (
                        <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div
                                    className={`inline-flex items-center justify-center w-12 h-12 ${stat.bgColor} rounded-lg mb-4`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`}/>
                                </div>
                                <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                                    {stat.value}
                                </div>
                                <div className="text-muted-foreground font-medium">{stat.label}</div>
                                <div className={`text-sm ${stat.color} mt-1`}>
                                  {stat.sublabel}
                                </div>


                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
