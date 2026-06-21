import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {ArrowLeft, Mail, Phone, HelpCircle} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import Layout from '@/components/Layout';
import {Card, CardContent, Input} from "@mui/material";
import axios from 'axios';
import {toast} from '@/hooks/use-toast';

const Support = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBack = () => {
        navigate('/');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setError(null); // Clear error when user types
    };

    const handleContactFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('http://localhost:8002/api/support/requests', formData, {
    headers: { 'Content-Type': 'application/json' }
});
            if (response.status === 201) {
                toast({
                    title: 'Message envoyé',
                    description: 'Merci pour votre message. Notre équipe vous répondra bientôt.',
                });
                setFormData({name: '', email: '', message: ''}); // Reset form
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Une erreur s\'est produite lors de l\'envoi. Veuillez réessayer.';
            setError(errorMsg);
            console.error('Error submitting form:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen py-16">
                {/* Hero/Support Header */}
                <section className="bg-gradient-to-br from-primary/10 via-white to-accent/10 py-12 mb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4">
                            <HelpCircle className="h-12 w-12 inline-block mr-2"/>
                            Support Client
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Nous sommes là pour vous aider 24/7. Contactez-nous pour toute question ou assistance.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-6 text-primary border-primary hover:bg-primary/10"
                            onClick={handleBack}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            Retour à l'accueil
                        </Button>
                    </div>
                </section>

                {/* Support Options */}
                <div
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Contact par Email */}
                    <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                        <CardContent className="space-y-4 text-center">
                            <div
                                className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-blue-600"/>
                            </div>
                            <h3 className="font-bold text-lg text-primary">Par Email</h3>
                            <p className="text-muted-foreground text-sm">
                                Envoyez-nous un message à tout moment.
                            </p>
                            <p className="text-lg font-medium">mb.daniel241@gmail.com</p>
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={() => (window.location.href = 'mailto:mb.daniel241@gmail.com')}
                            >
                                Envoyer un email
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Contact par Téléphone */}
                    <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                        <CardContent className="space-y-4 text-center">
                            <div
                                className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Phone className="h-8 w-8 text-green-600"/>
                            </div>
                            <h3 className="font-bold text-lg text-primary">Par Téléphone</h3>
                            <p className="text-muted-foreground text-sm">
                                Appelez notre équipe disponible 24/7.
                            </p>
                            <p className="text-lg font-medium">+241 74604327</p>
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={() => (window.location.href = 'tel:+24174604327')}
                            >
                                Appeler maintenant
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Formulaire de Contact */}
                    <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                        <CardContent className="space-y-4">
                            <div
                                className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                <HelpCircle className="h-8 w-8 text-purple-600"/>
                            </div>
                            <h3 className="font-bold text-lg text-primary">Formulaire de Contact</h3>
                            <p className="text-muted-foreground text-sm">
                                Remplissez ce formulaire pour une assistance personnalisée.
                            </p>
                            <form onSubmit={handleContactFormSubmit} className="space-y-4">
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Votre nom"
                                    className="w-full"
                                    required
                                />
                                <Input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    type="email"
                                    placeholder="Votre email"
                                    className="w-full"
                                    required
                                />
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="Votre message"
                                    rows={4}
                                    className="w-full border rounded-md p-2"
                                    required
                                    style={{resize: 'none'}}
                                />
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Envoi en cours...' : 'Envoyer'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Lien vers FAQ */}
                <div className="text-center mt-12">
                    <p className="text-lg text-muted-foreground mb-4">
                        Pour des réponses rapides, consultez notre{' '}
                        <Button
                            variant="link"
                            className="p-0 h-auto text-primary hover:underline"
                            onClick={() => navigate('/')}
                        >
                            Foire aux Questions
                        </Button>
                        .
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default Support;
