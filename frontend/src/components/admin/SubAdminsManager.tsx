import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { subAdminService, SubAdmin, CreateSubAdminInput } from "@/services/subAdminService";
import {adminConcoursService} from "@/services/adminConcoursService.ts";

const SubAdminsManager: React.FC = () => {
  const queryClient = useQueryClient();

  // ✅ Récupérer les infos de l'admin connecté depuis le localStorage
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const [form, setForm] = useState<CreateSubAdminInput>({
    etablissement_id: adminData.etablissement_id || 1,
    created_by: adminData.id || 1,
    nom: "",
    prenom: "",
    email: "",
    password: "",
    admin_role: "notes",
  });


  // --- Récupération des sous-admins ---
  const { data: subAdmins, isLoading } = useQuery<SubAdmin[]>({
    queryKey: ["subAdmins", form.etablissement_id],
    queryFn: async () => {
      const response = await subAdminService.getAll(form.etablissement_id);
      return response.data;
    },
  });

  // --- Création ---
  const createSubAdminMutation = useMutation({
    mutationFn: async (newAdmin: CreateSubAdminInput) => {
      const response = await subAdminService.create(newAdmin);
      return response.data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Succès", 
        description: "Sous-admin créé ! Un email avec les identifiants a été envoyé." 
      });
      queryClient.invalidateQueries({ queryKey: ["subAdmins", form.etablissement_id] });
      setForm({ ...form, nom: "", prenom: "", email: "", admin_role: "notes" });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Impossible d’ajouter le sous-admin.";
      toast({ title: "Erreur", description: message });
    },
  });

  // --- Suppression ---
  const deleteSubAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      await subAdminService.delete(id);
    },
    onSuccess: () => {
      toast({ title: "Supprimé", description: "Sous-admin supprimé avec succès." });
      queryClient.invalidateQueries({ queryKey: ["subAdmins", form.etablissement_id] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le sous-admin." });
    },
  });

  // --- Gestion des champs ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = () => {
    const { nom, prenom, email, admin_role } = form;
    if (!nom || !prenom || !email || !admin_role) {
      toast({ title: "Erreur", description: "Les champs nom, prénom, email et rôle sont requis." });
      return;
    }
    // Le mot de passe est généré automatiquement côté backend
    createSubAdminMutation.mutate(form);
  };

  const handleDelete = (id: number) => {
    deleteSubAdminMutation.mutate(id);
  };

  return (
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Gestion des Sous-Administrateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {/* --- FORMULAIRE --- */}
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <Input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} />
              <Input name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} />
            </div>
            <Input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} />
            <Select
                value={form.admin_role}
                onValueChange={(value) => setForm({ ...form, admin_role: value as "notes" | "documents" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notes">Gestion des Notes</SelectItem>
                <SelectItem value="documents">Validation des Documents</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              ℹ️ Un mot de passe temporaire sera généré automatiquement et envoyé par email.
            </p>
          </div>

          <Button onClick={handleCreate} disabled={createSubAdminMutation.isPending}>
            Ajouter
          </Button>

          {/* --- LISTE DES SOUS-ADMINS --- */}
          <div className="mt-6">
            {isLoading ? (
                <p>Chargement...</p>
            ) : subAdmins && subAdmins.length > 0 ? (
                <ul className="space-y-3">
                  {subAdmins.map((admin) => (
                      <li key={admin.id} className="flex items-center justify-between border p-2 rounded">
                  <span>
                    {admin.nom} {admin.prenom} ({admin.email}) — <b>{admin.admin_role}</b>
                  </span>
                        <Button
                            variant="destructive"
                            onClick={() => handleDelete(admin.id)}
                            disabled={deleteSubAdminMutation.isPending}
                        >
                          Supprimer
                        </Button>
                      </li>
                  ))}
                </ul>
            ) : (
                <p>Aucun sous-admin trouvé.</p>
            )}
          </div>
        </CardContent>
      </Card>
  );
};

export default SubAdminsManager;
