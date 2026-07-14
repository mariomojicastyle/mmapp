import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';

const inputClasses =
  'w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-text-dark text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors mb-4 placeholder:text-text-muted-dark';

export default function ContactCTA() {
  const { t } = useLanguage();
  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3003';

  // Estados del Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    correo: '',
    telefono: '',
    productos: '',
    mensaje: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const trustSignals = [
    { icon: 'verified', text: t('Sin compromiso de compra', 'No purchase commitment', 'Sem compromisso de compra') },
    { icon: 'schedule', text: t('Entrega en 5-10 días hábiles', 'Delivery in 5-10 business days', 'Entrega em 5-10 dias úteis') },
    { icon: 'lock', text: t('Propiedad industrial 100% protegida y confidencialidad (NDA)', 'Industrial property 100% protected and confidentiality (NDA)', 'Propriedade industrial 100% protegida e confidencialidade (NDA)') },
  ];

  const catalogOptions = [
    t('1 - 10 productos', '1 - 10 products', '1 - 10 produtos'),
    t('11 - 50 productos', '11 - 50 products', '11 - 50 produtos'),
    t('51 - 200 productos', '51 - 200 products', '51 - 200 produtos'),
    t('Más de 200 productos', 'More than 200 products', 'Mais de 200 produtos'),
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.mariomojica.com/webhook/leads-v3';
      const webhookToken = process.env.NEXT_PUBLIC_WEBHOOK_TOKEN || 'mm_lead_secure_v1_83f982d1';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-Token': webhookToken,
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: 'ND', 
          correo: formData.correo.trim(),
          empresa: formData.empresa.trim().replace(/\\n/g, ' '),
          pais: 'Colombia', 
          telefono: formData.telefono ? formData.telefono.trim() : 'ND',
          rol: 'Otro',
          interes: 'Manual de armado interactivo en 3D',
          descripcion: `Catálogo: ${formData.productos}. Comentarios: ${formData.mensaje ? formData.mensaje.replace(/\\n/g, ' ') : 'ND'}`,
          origen: 'B2B Landing (Manuales 3D)',
          fecha: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Tracking de Umami para conversiones exitosas
      if (typeof window !== 'undefined' && (window as any).umami) {
        (window as any).umami.track('Lead Form Submitted', {
          catalog: formData.productos,
          company: formData.empresa
        });
      }

      setStatus('success');
      setFormData({
        nombre: '',
        empresa: '',
        correo: '',
        telefono: '',
        productos: '',
        mensaje: ''
      });
    } catch (err) {
      console.error('Error submitting lead to n8n:', err);
      setStatus('error');
    }
  };

  return (
    <section id="contacto" className="py-24 md:py-32 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* LEFT COLUMN — Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            {t('Obtén un prototipo interactivo 3D gratuito', 'Get a Free 3D Interactive Prototype', 'Obtenha um protótipo interativo 3D gratuito')}
          </h2>
          <p className="text-text-muted-dark text-lg mb-8 leading-relaxed">
            {t(
              'Envíanos uno de tus muebles y te devolveremos un manual interactivo 3D completo sin costo. Comprueba el impacto antes de decidir.',
              'Send us one of your furniture products and we will return a complete interactive 3D manual at no cost. Test the impact before you decide.',
              'Envie-nos um dos seus móveis e devolveremos um manual interativo 3D completo sem custo. Comprove o impacto antes de decidir.'
            )}
          </p>

          <div>
            {trustSignals.map((signal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 mb-4 text-text-muted-dark text-sm"
              >
                <span className="material-symbols-outlined text-primary text-xl">
                  {signal.icon}
                </span>
                <span>{signal.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT COLUMN — Form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <div className="bg-surface-dark rounded-2xl p-8 border border-border-dark min-h-[460px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-primary text-5xl">task_alt</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {t('¡Solicitud Recibida!', 'Request Received!', 'Solicitação Recebida!')}
                  </h3>
                  <p className="text-text-muted-dark text-sm leading-relaxed max-w-sm mx-auto mb-8">
                    {t(
                      'Hemos recibido tus datos correctamente. Nuestro equipo técnico se pondrá en contacto contigo en las próximas 24 horas para coordinar la entrega de tu prototipo 3D gratuito.',
                      'We have successfully received your information. Our technical team will reach out within 24 hours to coordinate the delivery of your free 3D prototype.',
                      'Recebemos seus dados com sucesso. Nossa equipe técnica entrará em contato em até 24 horas para coordenar a entrega do seu protótipo 3D gratuito.'
                    )}
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="bg-primary/20 hover:bg-primary border border-primary text-white py-3 px-8 rounded-full font-bold text-sm transition-all cursor-pointer"
                  >
                    {t('Enviar otra solicitud', 'Send another request', 'Enviar outra solicitação')}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder={t('Nombre completo *', 'Full Name *', 'Nome completo *')}
                    className={inputClasses}
                    disabled={status === 'loading'}
                  />
                  <input
                    type="text"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    required
                    placeholder={t('Empresa / Marca *', 'Company / Brand *', 'Empresa / Marca *')}
                    className={inputClasses}
                    disabled={status === 'loading'}
                  />
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    placeholder={t('Email corporativo *', 'Corporate Email *', 'E-mail corporativo *')}
                    className={inputClasses}
                    disabled={status === 'loading'}
                  />
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder={t('Teléfono / WhatsApp', 'Phone / WhatsApp', 'Telefone / WhatsApp')}
                    className={inputClasses}
                    disabled={status === 'loading'}
                  />
                  <div className="relative">
                    <select
                      name="productos"
                      value={formData.productos}
                      onChange={handleChange}
                      required
                      className={`${inputClasses} appearance-none`}
                      disabled={status === 'loading'}
                    >
                      <option value="" disabled>
                        {t('¿Cuántos productos tiene tu catálogo? *', 'How many products are in your catalog? *', 'Quantos produtos tem seu catálogo? *')}
                      </option>
                      {catalogOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3 text-text-muted-dark pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    placeholder={t('Mensaje o comentarios', 'Message or comments', 'Mensagem ou comentários')}
                    rows={3}
                    className={inputClasses}
                    disabled={status === 'loading'}
                  />

                  {status === 'error' && (
                    <div className="text-red-400 text-xs mb-4 text-center">
                      {t(
                        'Hubo un problema al enviar tus datos. Por favor, inténtalo de nuevo.',
                        'There was a problem sending your details. Please try again.',
                        'Houve um problema ao enviar seus dados. Por favor, tente novamente.'
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-primary text-white py-4 rounded-full font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl shadow-primary/30 hover:scale-[1.02] mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {status === 'loading'
                      ? t('Enviando...', 'Sending...', 'Enviando...')
                      : t('Solicitar Prototipo Gratuito', 'Request Free Prototype', 'Solicitar Protótipo Gratuito')}
                    {status !== 'loading' && (
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {status !== 'success' && (
              <p className="text-xs text-text-muted-dark text-center mt-4">
                {t('Al enviar, aceptas nuestra ', 'By submitting, you agree to our ', 'Ao enviar, você concorda com nossa ')}
                <Link href={`${platformUrl}/privacy`} className="text-primary hover:underline">
                  {t('política de privacidad', 'privacy policy', 'política de privacidade')}
                </Link>.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
