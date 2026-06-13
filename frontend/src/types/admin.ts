export interface Admin {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: 'super_admin' | 'admin_etablissement' | 'sub_admin';
    admin_role : 'notes'| 'documents';
    etablissement_id?: number;
    etablissement_nom?: string;
    statut: 'actif' | 'inactif' | 'suspendu';
    derniere_connexion?: string;
    created_by?: number;
    created_at: string;
    updated_at: string;
}

export interface AdminLogin {
    email: string;
    password: string;
}

export interface AdminSession {
    id: number;
    email: string;
    role: 'super_admin' | 'admin_etablissement' | 'sub_admin';
    admin_role : 'notes'| 'documents';
    nom: string;
    prenom: string;
    etablissement_id?: number;
    etablissement_nom?: string;
}

export interface AdminLog {
    id: number;
    admin_id: number;
    action: string;
    table_name: string;
    record_id?: number;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    admin_nom?: string;
    admin_prenom?: string;
    admin_email?: string;
    admin_role?: string;
    admin_admin_role?: string;
}

export interface CreateAdminRequest {
    nom: string;
    prenom: string;
    email: string;
    etablissement_id?: number;
    role: 'admin_etablissement' |  'sub_admin';
    admin_role?: 'notes' | 'documents';
}

export interface PasswordResetRequest {
    token: string;
    new_password: string;
    confirm_password: string;
}
