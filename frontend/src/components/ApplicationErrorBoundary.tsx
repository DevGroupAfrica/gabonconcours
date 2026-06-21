import React from 'react';
import {AlertTriangle, Home, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';

interface ApplicationErrorBoundaryState {
    hasError: boolean;
}

class ApplicationErrorBoundary extends React.Component<React.PropsWithChildren, ApplicationErrorBoundaryState> {
    state: ApplicationErrorBoundaryState = {hasError: false};

    static getDerivedStateFromError(): ApplicationErrorBoundaryState {
        return {hasError: true};
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Erreur inattendue dans l’application:', error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-5">
                <section className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-7 text-center shadow-xl shadow-slate-900/5 sm:p-9">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertTriangle className="h-6 w-6"/>
                    </span>
                    <h1 className="mt-5 text-2xl font-bold text-slate-950">Cette page a rencontré un problème</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        Vos données ne sont pas perdues. Rechargez la page pour reprendre, ou retournez à l’accueil.
                    </p>
                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button onClick={() => window.location.reload()}>
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Recharger la page
                        </Button>
                        <Button variant="outline" onClick={() => window.location.assign('/')}>
                            <Home className="mr-2 h-4 w-4"/>
                            Retour à l’accueil
                        </Button>
                    </div>
                </section>
            </main>
        );
    }
}

export default ApplicationErrorBoundary;
