import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {TrendingUp, TrendingDown, Users, Trophy, Building, DollarSign} from 'lucide-react';
import {useRealtimeData} from '@/hooks/useRealtimeData';

const DashboardStats = () => {
    const {statistics, isLoading} = useRealtimeData();

    const stats = [
        {
            title: "Total Candidats",
            value: statistics.candidats,
            change: "+12%",
            trend: "up",
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-500",
        },
        {
            title: "Concours Actifs",
            value: statistics.concours,
            change: "+5%",
            trend: "up",
            icon: Trophy,
            color: "text-purple-500",
            bgColor: "bg-purple-500",
        },
        {
            title: "Établissements",
            value: statistics.etablissements,
            change: "0%",
            trend: "stable",
            icon: Building,
            color: "text-green-500",
            bgColor: "bg-green-500",
        },
        {
            title: "Paiements",
            value: statistics.paiements,
            change: "+18%",
            trend: "up",
            icon: DollarSign,
            color: "text-orange-500",
            bgColor: "bg-orange-500",
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-20 bg-gray-200 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className={`absolute top-0 left-0 w-full h-1 ${stat.bgColor}`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg bg-opacity-10 ${stat.bgColor}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`}/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="flex items-center space-x-1 text-xs">
                            {stat.trend === "up" ? (
                                <TrendingUp className="h-3 w-3 text-green-500"/>
                            ) : stat.trend === "down" ? (
                                <TrendingDown className="h-3 w-3 text-red-500"/>
                            ) : null}
                            <span className={`${
                                stat.trend === "up" ? "text-green-500" :
                                    stat.trend === "down" ? "text-red-500" :
                                        "text-gray-500"
                            }`}>
                {stat.change} par rapport au mois dernier
              </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default DashboardStats;
