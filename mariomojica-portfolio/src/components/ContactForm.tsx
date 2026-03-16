"use client";

import React, { useState } from "react";

const roles = [
    "Propietario de negocio",
    "Director de marketing",
    "Director digital",
    "Director de Comercialización",
    "Vicepresidente/Director de Marketing",
    "Vicepresidente/Director de Comercio Electrónico",
    "VP / Director de Marca – Creativo",
    "VP / Director de Visualización",
    "Gerente de marketing",
    "Gerente de marca/creativo",
    "Gerente de comercio electrónico",
    "Gerente de comercialización",
    "Gerente de proyecto",
    "Gerente de categoría/producto",
    "Especialista en visualización/Artista 3D",
    "Otro",
    "Director de Tecnología",
    "Director Ejecutivo",
    "Director de Experiencia",
    "Director de Atención al Cliente",
    "Director de Finanzas",
];

const interests = [
    "Automatizaciones",
    "Asesoría en manufactura",
    "Diseño de producto básico",
    "Diseño de producto BIM",
    "Producto personalizable en línea",
    "Renders de producto para venta online",
    "Video de producto con IA",
    "Realidad Aumentada",
    "Manual de armado interactivo en 3D",
    "Planos de fabricación",
    "Archivos CNC o STL para fabricación",
    "Archivos GLB para aplicaciones",
    "Desarrollo web",
    "Automatizaciones para mercadeo",
];

type FormStatus = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
    const [status, setStatus] = useState<FormStatus>("idle");
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        correo: "",
        empresa: "",
        pais: "",
        telefono: "",
        rol: "",
        interes: "",
        descripcion: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
            
            if (!webhookUrl) {
                throw new Error("Webhook URL not configured");
            }

            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    fecha: new Date().toISOString(),
                    origen: "Portafolio Web"
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit");
            }

            setStatus("success");
            // Reset form on success
            setFormData({
                nombre: "",
                apellido: "",
                correo: "",
                empresa: "",
                pais: "",
                telefono: "",
                rol: "",
                interes: "",
                descripcion: "",
            });
        } catch (error) {
            console.error("Error submitting form:", error);
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <section className="py-24 px-6 bg-white" id="contact">
                <div className="container mx-auto max-w-3xl text-center">
                    <div className="bg-[#FDFCF8] p-12 border-[0.5px] border-[#0088AA] rounded-3xl shadow-2xl">
                        <div className="w-20 h-20 bg-[#0088AA] rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-gray-900 uppercase italic">
                            ¡Mensaje recibido!
                        </h2>
                        <p className="text-gray-600 text-lg mb-8">
                            Gracias por tu interés, Mario. He recibido tus datos y te contactaré en breve por WhatsApp para agendar nuestra demostración.
                        </p>
                        <button 
                            onClick={() => setStatus("idle")}
                            className="text-[#0088AA] font-black uppercase tracking-widest text-sm hover:underline"
                        >
                            Enviar otro mensaje
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-24 px-6 bg-white" id="contact">
            <div className="container mx-auto max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-gray-900 uppercase italic text-center">
                    ¿Tienes un proyecto en mente?
                </h2>
                <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
                    Completa este formulario para recibir una asesoría personalizada sobre cómo la IA y las automatizaciones pueden escalar tu negocio.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {status === "error" && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                            <p className="text-red-700 text-sm">
                                Lo siento, hubo un problema al enviar tus datos. Por favor, intenta de nuevo o contáctame directamente.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="nombre" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                                Nombre *
                            </label>
                            <input
                                required
                                type="text"
                                id="nombre"
                                name="nombre"
                                disabled={status === "loading"}
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="apellido" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                                Apellido *
                            </label>
                            <input
                                required
                                type="text"
                                id="apellido"
                                name="apellido"
                                disabled={status === "loading"}
                                value={formData.apellido}
                                onChange={handleChange}
                                className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="correo" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                            Correo electrónico comercial *
                        </label>
                        <input
                            required
                            type="email"
                            id="correo"
                            name="correo"
                            disabled={status === "loading"}
                            value={formData.correo}
                            onChange={handleChange}
                            className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="empresa" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                            Nombre de empresa *
                        </label>
                        <input
                            required
                            type="text"
                            id="empresa"
                            name="empresa"
                            disabled={status === "loading"}
                            value={formData.empresa}
                            onChange={handleChange}
                            className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="pais" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                                País / Región *
                            </label>
                            <input
                                required
                                type="text"
                                id="pais"
                                name="pais"
                                disabled={status === "loading"}
                                value={formData.pais}
                                onChange={handleChange}
                                placeholder="Por favor seleccione/escriba"
                                className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="telefono" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                                Teléfono directo *
                            </label>
                            <input
                                required
                                type="tel"
                                id="telefono"
                                name="telefono"
                                disabled={status === "loading"}
                                value={formData.telefono}
                                onChange={handleChange}
                                className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="rol" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                            ¿Qué describe mejor tu rol? *
                        </label>
                        <select
                            required
                            id="rol"
                            name="rol"
                            disabled={status === "loading"}
                            value={formData.rol}
                            onChange={handleChange}
                            className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors appearance-none disabled:opacity-50"
                        >
                            <option value="" disabled>Por favor seleccione</option>
                            {roles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="interes" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                            Para una demostración más personalizada, cuéntame qué te interesa *
                        </label>
                        <select
                            required
                            id="interes"
                            name="interes"
                            disabled={status === "loading"}
                            value={formData.interes}
                            onChange={handleChange}
                            className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors appearance-none disabled:opacity-50"
                        >
                            <option value="" disabled>Seleccione una opción</option>
                            {interests.map((interest) => (
                                <option key={interest} value={interest}>{interest}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="descripcion" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                            Descripción de la idea *
                        </label>
                        <textarea
                            required
                            id="descripcion"
                            name="descripcion"
                            disabled={status === "loading"}
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Cuéntame brevemente sobre tu proyecto o idea..."
                            className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50 resize-none"
                        />
                    </div>

                    <div className="pt-8 text-center">
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="inline-block bg-[#0088AA] text-white py-4 px-14 font-black text-lg uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl shadow-teal-900/10 rounded-full cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {status === "loading" ? "Procesando..." : "Reserva mi demostración"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
