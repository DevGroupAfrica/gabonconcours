import { api } from "@/services/api.ts";

// --- TYPES ---
export interface SubAdmin {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    etablissement_id: number;
    created_by: number;
    admin_role: "notes" | "documents";
}

export interface CreateSubAdminInput {
    etablissement_id: number;
    created_by: number;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    admin_role: "notes" | "documents";
}

export const subAdminService = {
    async getAll(etablissement_id: number): Promise<{ data: SubAdmin[] }> {
        return api.get(`/subadmins/etablissement/${etablissement_id}`);
    },

    async create(payload: CreateSubAdminInput): Promise<{ data: SubAdmin }> {
        return api.post(`/subadmins/create`, payload);
    },

    async delete(id: number): Promise<void> {
        return api.delete(`/subadmins/${id}`);
    },
};
