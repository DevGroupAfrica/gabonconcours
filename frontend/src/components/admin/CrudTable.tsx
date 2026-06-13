import React, {useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, Plus, Edit, Trash2, Eye} from 'lucide-react';

interface Column {
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
}

interface CrudTableProps {
    title: string;
    description?: string;
    data: any[];
    columns: Column[];
    isLoading?: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onAdd?: () => void;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
    onView?: (item: any) => void;
    searchPlaceholder?: string;
}

const CrudTable: React.FC<CrudTableProps> = ({
                                                 title,
                                                 description,
                                                 data,
                                                 columns,
                                                 isLoading,
                                                 searchTerm,
                                                 onSearchChange,
                                                 onAdd,
                                                 onEdit,
                                                 onDelete,
                                                 onView,
                                                 searchPlaceholder = "Rechercher..."
                                             }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                    {description && <p className="text-muted-foreground">{description}</p>}
                </div>
                {onAdd && (
                    <Button onClick={onAdd}>
                        <Plus className="h-4 w-4 mr-2"/>
                        Ajouter
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des {title.toLowerCase()}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableHead key={column.key}>{column.label}</TableHead>
                                ))}
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    {columns.map((column) => (
                                        <TableCell key={column.key}>
                                            {column.render
                                                ? column.render(item[column.key], item)
                                                : item[column.key]
                                            }
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            {onView && (
                                                <Button variant="ghost" size="sm" onClick={() => onView(item)}>
                                                    <Eye className="h-4 w-4"/>
                                                </Button>
                                            )}
                                            {onEdit && (
                                                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {data.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Aucun élément trouvé
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CrudTable;
