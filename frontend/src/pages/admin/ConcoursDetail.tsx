import React, {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, CalendarDays, Eye, FileText, Info, Loader2, Plus, Save, Trash2} from 'lucide-react';
import {apiService} from '@/services/api';
import {toast} from '@/hooks/use-toast';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

type RequiredDocument = {nom: string; obligatoire: boolean; description: string};
type Section = 'informations' | 'dates' | 'documents';
type FormState = {
    etablissement_id: string; niveau_id: string;
    libcnc: string; sescnc: string; type_concours: string; description_concours: string;
    debcnc: string; fincnc: string; agecnc: number; fracnc: number; nombre_places_total: number;
    duree_formation: string; diplome_delivre: string; date_publication_resultats: string;
    date_debut_cours: string; contact_email: string; contact_telephone: string; lieu_examen: string;
    informations_complementaires: string; stacnc: string; is_gorri: number; documents_requis: RequiredDocument[];
};

const emptyForm: FormState = {
    etablissement_id: '', niveau_id: '', libcnc: '', sescnc: '', type_concours: 'autre', description_concours: '', debcnc: '', fincnc: '',
    agecnc: 0, fracnc: 0, nombre_places_total: 0, duree_formation: '', diplome_delivre: '',
    date_publication_resultats: '', date_debut_cours: '', contact_email: '', contact_telephone: '',
    lieu_examen: '', informations_complementaires: '', stacnc: '1', is_gorri: 0, documents_requis: []
};

const dateValue = (value: unknown) => typeof value === 'string' ? value.slice(0, 10) : '';
const textValue = (value: unknown) => value === null || value === undefined ? '' : String(value);
const numberValue = (value: unknown) => Number(value || 0);

const ConcoursDetail = () => {
    const {id = ''} = useParams();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [activeSection, setActiveSection] = useState<Section>('informations');
    const {data: response, isLoading, isError} = useQuery({
        queryKey: ['admin-concours-detail', id],
        queryFn: () => apiService.getConcoursById<any>(id),
        enabled: !!id,
    });
    const {data: etablissementsResponse} = useQuery({queryKey: ['admin-etablissements'], queryFn: () => apiService.getEtablissements<any[]>()});
    const {data: niveauxResponse} = useQuery({queryKey: ['admin-niveaux'], queryFn: () => apiService.getNiveaux<any[]>()});
    const concours = response?.data;
    const etablissements = etablissementsResponse?.data || [];
    const niveaux = niveauxResponse?.data || [];
    const selectedEtablissement = etablissements.find((item: any) => item.id.toString() === form.etablissement_id);
    const selectedNiveau = niveaux.find((item: any) => item.id.toString() === form.niveau_id);

    useEffect(() => {
        if (!concours) return;
        setForm({
            ...emptyForm,
            etablissement_id: textValue(concours.etablissement_id),
            niveau_id: textValue(concours.niveau_id),
            libcnc: textValue(concours.libcnc),
            sescnc: textValue(concours.sescnc),
            type_concours: textValue(concours.type_concours) || 'autre',
            description_concours: textValue(concours.description_concours),
            debcnc: dateValue(concours.debcnc),
            fincnc: dateValue(concours.fincnc),
            agecnc: numberValue(concours.agecnc),
            fracnc: numberValue(concours.fracnc),
            nombre_places_total: numberValue(concours.nombre_places_total),
            duree_formation: textValue(concours.duree_formation),
            diplome_delivre: textValue(concours.diplome_delivre),
            date_publication_resultats: dateValue(concours.date_publication_resultats),
            date_debut_cours: dateValue(concours.date_debut_cours),
            contact_email: textValue(concours.contact_email),
            contact_telephone: textValue(concours.contact_telephone),
            lieu_examen: textValue(concours.lieu_examen),
            informations_complementaires: textValue(concours.informations_complementaires),
            stacnc: textValue(concours.stacnc) || '1',
            is_gorri: numberValue(concours.is_gorri),
            documents_requis: Array.isArray(concours.documents_requis) ? concours.documents_requis.map((doc: any) => ({
                nom: textValue(doc?.nom),
                obligatoire: doc?.obligatoire !== false,
                description: textValue(doc?.description),
            })) : [],
        });
    }, [concours]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            const result = await apiService.updateConcours(id, form);
            if (!result.success) {
                throw new Error(result.message || result.errors?.[0] || 'Impossible de modifier le concours');
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-concours']});
            queryClient.invalidateQueries({queryKey: ['admin-concours-detail', id]});
            toast({title: 'Concours modifié', description: 'Les informations ont été enregistrées.'});
        },
        onError: (error: Error) => toast({title: 'Modification impossible', description: error.message, variant: 'destructive'}),
    });

    const set = (key: keyof FormState, value: FormState[keyof FormState]) => setForm(previous => ({...previous, [key]: value}));
    const updateDocument = (index: number, patch: Partial<RequiredDocument>) =>
        set('documents_requis', form.documents_requis.map((doc, i) => i === index ? {...doc, ...patch} : doc));
    const save = () => {
        const names = form.documents_requis.map(doc => doc.nom.trim()).filter(Boolean);
        if (!form.libcnc.trim() || !names.length || new Set(names.map(name => name.toLowerCase())).size !== names.length) {
            toast({title: 'Informations invalides', description: 'Le nom du concours et des documents requis uniques sont obligatoires.', variant: 'destructive'});
            return;
        }
        updateMutation.mutate();
    };

    if (isLoading) return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div>;
    if (isError || !concours) return <Card><CardContent className="p-8 text-center">Concours introuvable.</CardContent></Card>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button asChild variant="ghost" className="-ml-4 mb-2"><Link to="/admin/concour"><ArrowLeft className="mr-2 h-4 w-4"/>Retour aux concours</Link></Button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold">{concours.libcnc}</h1>
                        <Badge variant={form.stacnc === '1' ? 'default' : 'secondary'}>{form.stacnc === '1' ? 'Actif' : 'Inactif'}</Badge>
                        <Badge variant="outline">ID {id}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{concours.etablissement_nomets || 'Établissement non renseigné'} · {concours.niveau_nomniv || 'Niveau non renseigné'}</p>
                </div>
                <Button onClick={save} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Enregistrer les modifications
                </Button>
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
                <Card className="overflow-hidden xl:sticky xl:top-4">
                    <div className="border-b bg-slate-50 p-6 text-slate-950">
                        <div className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500"><Eye className="h-4 w-4"/>Vue du concours</div>
                        <h2 className="text-2xl font-bold leading-tight">{form.libcnc || 'Nom du concours'}</h2>
                        <p className="mt-2 text-sm text-slate-500">{selectedEtablissement?.nomets || 'Établissement non renseigné'}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-white">{form.sescnc || 'Session'}</Badge>
                            <Badge className={form.stacnc === '1' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-200 text-slate-700 hover:bg-slate-200'}>{form.stacnc === '1' ? 'Ouvert' : 'Fermé'}</Badge>
                        </div>
                    </div>
                    <CardContent className="space-y-5 p-5">
                        <PreviewRow label="Niveau" value={selectedNiveau?.nomniv || 'Non renseigné'}/>
                        <PreviewRow label="Frais d'inscription" value={`${Number(form.fracnc || 0).toLocaleString('fr-FR')} FCFA`}/>
                        <PreviewRow label="Places disponibles" value={form.nombre_places_total ? form.nombre_places_total.toString() : 'Non limité'}/>
                        <PreviewRow label="Période d'inscription" value={form.debcnc && form.fincnc ? `${formatDate(form.debcnc)} - ${formatDate(form.fincnc)}` : 'Non renseignée'}/>
                        <PreviewRow label="Documents demandés" value={`${form.documents_requis.length} document(s)`}/>
                        {form.description_concours && <div className="border-t pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Présentation</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{form.description_concours}</p></div>}
                    </CardContent>
                </Card>

                <div className="min-w-0 space-y-4">
                    <div className="flex overflow-x-auto rounded-xl border bg-background p-1">
                        <SectionButton active={activeSection === 'informations'} onClick={() => setActiveSection('informations')} icon={<Info className="h-4 w-4"/>}>Informations</SectionButton>
                        <SectionButton active={activeSection === 'dates'} onClick={() => setActiveSection('dates')} icon={<CalendarDays className="h-4 w-4"/>}>Dates et contacts</SectionButton>
                        <SectionButton active={activeSection === 'documents'} onClick={() => setActiveSection('documents')} icon={<FileText className="h-4 w-4"/>}>Documents <Badge variant="secondary" className="ml-1">{form.documents_requis.length}</Badge></SectionButton>
                    </div>

                    {activeSection === 'informations' && <Card>
                        <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <Field label="Nom du concours"><Input value={form.libcnc} onChange={e => set('libcnc', e.target.value)}/></Field>
                            <Field label="Session"><Input value={form.sescnc} onChange={e => set('sescnc', e.target.value)}/></Field>
                            <Field label="Type"><Select value={form.type_concours} onValueChange={value => set('type_concours', value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="premiere_annee">Première année</SelectItem><SelectItem value="master">Master</SelectItem><SelectItem value="doctorat">Doctorat</SelectItem><SelectItem value="autre">Autre</SelectItem></SelectContent></Select></Field>
                            <Field label="Établissement"><Select value={form.etablissement_id} onValueChange={value => set('etablissement_id', value)}><SelectTrigger><SelectValue placeholder="Sélectionner"/></SelectTrigger><SelectContent>{etablissements.map((item: any) => <SelectItem key={item.id} value={item.id.toString()}>{item.nomets}</SelectItem>)}</SelectContent></Select></Field>
                            <Field label="Niveau"><Select value={form.niveau_id} onValueChange={value => set('niveau_id', value)}><SelectTrigger><SelectValue placeholder="Sélectionner"/></SelectTrigger><SelectContent>{niveaux.map((item: any) => <SelectItem key={item.id} value={item.id.toString()}>{item.nomniv}</SelectItem>)}</SelectContent></Select></Field>
                            <Field label="Frais (FCFA)"><Input type="number" value={form.fracnc} onChange={e => set('fracnc', Number(e.target.value))}/></Field>
                            <Field label="Âge maximum"><Input type="number" value={form.agecnc} onChange={e => set('agecnc', Number(e.target.value))}/></Field>
                            <Field label="Nombre de places"><Input type="number" value={form.nombre_places_total} onChange={e => set('nombre_places_total', Number(e.target.value))}/></Field>
                            <Field label="Diplôme délivré"><Input value={form.diplome_delivre} onChange={e => set('diplome_delivre', e.target.value)}/></Field>
                            <Field label="Durée de formation"><Input value={form.duree_formation} onChange={e => set('duree_formation', e.target.value)}/></Field>
                            <div className="flex items-center gap-6 pt-6"><Check label="Concours actif" checked={form.stacnc === '1'} onChange={checked => set('stacnc', checked ? '1' : '0')}/><Check label="Programme Gorri" checked={!!form.is_gorri} onChange={checked => set('is_gorri', checked ? 1 : 0)}/></div>
                            <Field label="Description" className="md:col-span-2"><Textarea rows={5} value={form.description_concours} onChange={e => set('description_concours', e.target.value)}/></Field>
                        </CardContent>
                    </Card>}

                    {activeSection === 'dates' && <Card>
                        <CardHeader><CardTitle>Dates et contacts</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            {(['debcnc', 'fincnc', 'date_publication_resultats', 'date_debut_cours'] as const).map((key, index) => <Field key={key} label={['Début inscriptions', 'Fin inscriptions', 'Publication résultats', 'Début des cours'][index]}><Input type="date" value={form[key]} onChange={e => set(key, e.target.value)}/></Field>)}
                            <Field label="Email de contact"><Input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}/></Field>
                            <Field label="Téléphone"><Input value={form.contact_telephone} onChange={e => set('contact_telephone', e.target.value)}/></Field>
                            <Field label="Lieu d’examen" className="md:col-span-2"><Input value={form.lieu_examen} onChange={e => set('lieu_examen', e.target.value)}/></Field>
                            <Field label="Informations complémentaires" className="md:col-span-2"><Textarea rows={5} value={form.informations_complementaires} onChange={e => set('informations_complementaires', e.target.value)}/></Field>
                        </CardContent>
                    </Card>}

                    {activeSection === 'documents' && <Card>
                        <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Documents autorisés</CardTitle><p className="mt-1 text-sm text-muted-foreground">Seuls ces documents pourront être téléversés par les candidats.</p></div><Button variant="outline" size="sm" onClick={() => set('documents_requis', [...form.documents_requis, {nom: '', obligatoire: true, description: ''}])}><Plus className="mr-2 h-4 w-4"/>Ajouter</Button></CardHeader>
                        <CardContent className="space-y-3">
                            {form.documents_requis.map((doc, index) => <div key={index} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1.5fr_auto_auto] md:items-center"><Input placeholder="Nom du document" value={doc.nom} onChange={e => updateDocument(index, {nom: e.target.value})}/><Input placeholder="Description" value={doc.description || ''} onChange={e => updateDocument(index, {description: e.target.value})}/><Check label="Obligatoire" checked={doc.obligatoire} onChange={checked => updateDocument(index, {obligatoire: checked})}/><Button variant="ghost" size="icon" onClick={() => set('documents_requis', form.documents_requis.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>)}
                        </CardContent>
                    </Card>}
                </div>
            </div>
        </div>
    );
};

const Field = ({label, children, className = ''}: {label: string; children: React.ReactNode; className?: string}) => <div className={className}><Label className="mb-2 block">{label}</Label>{children}</div>;
const Check = ({label, checked, onChange}: {label: string; checked: boolean; onChange: (checked: boolean) => void}) => <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={checked} onCheckedChange={value => onChange(value === true)}/>{label}</label>;
const PreviewRow = ({label, value}: {label: string; value: string}) => <div className="flex items-start justify-between gap-4"><span className="text-sm text-muted-foreground">{label}</span><span className="text-right text-sm font-semibold">{value}</span></div>;
const SectionButton = ({active, onClick, icon, children}: {active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode}) => <button type="button" onClick={onClick} className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-slate-100 text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{icon}{children}</button>;
const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR');

export default ConcoursDetail;
