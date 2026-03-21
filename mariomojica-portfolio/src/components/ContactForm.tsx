"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

type FormStatus = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
    const t = useTranslations("Index");
    const tForm = useTranslations("Index.Form");
    const tRoot = useTranslations();
    const roles = tRoot.raw("Roles");
    const interests = tRoot.raw("Interests");
    
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
            // Usar variable de entorno o URL de respaldo si no está configurada en la nube
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://n8n.mariomojica.com/webhook/leads-v3";
            
            console.log("Iniciando envío a:", webhookUrl);

            const response = await fetch(webhookUrl, {
                method: "POST",
                mode: "cors", // Asegurar CORS para comunicación entre dominios
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    fecha: new Date().toISOString(),
                    origen: "Portafolio Web (Producción Mobile)"
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Respuesta de error de n8n:", errorData);
                throw new Error(`Error en el servidor: ${response.status}`);
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
                            {t("Contact.success_h2")}
                        </h2>
                        <p className="text-gray-600 text-lg mb-8">
                            {t("Contact.success_p")}
                        </p>
                        <button 
                            onClick={() => setStatus("idle")}
                            className="text-[#0088AA] font-black uppercase tracking-widest text-sm hover:underline"
                        >
                            {t("Contact.success_btn")}
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
                    {t("Contact.title")}
                </h2>
                <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
                    {t("Contact.subtitle")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {status === "error" && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                            <p className="text-red-700 text-sm">
                                {t("Contact.error_p")}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="nombre" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                                {tForm("name")} *
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
                                {tForm("lastname")} *
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
                            {tForm("email")} *
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
                            {tForm("company")} *
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
                                {tForm("country")} *
                            </label>
                            <input
                                required
                                type="text"
                                id="pais"
                                name="pais"
                                disabled={status === "loading"}
                                value={formData.pais}
                                onChange={handleChange}
                                className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="telefono" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                                {tForm("phone")} *
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
                            {tForm("role_label")} *
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
                            <option value="" disabled>{tForm("role_select")}</option>
                            {roles.map((role: string) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="interes" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                            {tForm("interest_label")} *
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
                            <option value="" disabled>{tForm("interest_select")}</option>
                            {interests.map((interest: string) => (
                                <option key={interest} value={interest}>{interest}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="descripcion" className="block text-xs font-black uppercase tracking-widest text-[#0088AA]">
                            {tForm("description_label")} *
                        </label>
                        <textarea
                            required
                            id="descripcion"
                            name="descripcion"
                            disabled={status === "loading"}
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={4}
                            placeholder={tForm("description_placeholder")}
                            className="w-full bg-[#FDFCF8] border-[0.5px] border-gray-200 p-4 text-gray-900 focus:outline-none focus:border-[#0088AA] transition-colors disabled:opacity-50 resize-none"
                        />
                    </div>

                    <div className="pt-8 text-center relative z-20">
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="inline-block bg-[#0088AA] text-white py-4 px-14 font-black text-lg uppercase tracking-widest hover:bg-opacity-90 active:scale-95 transition-all shadow-xl shadow-teal-900/10 rounded-full cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed relative z-30"
                        >
                            {status === "loading" ? tForm("loading") : tForm("submit")}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
