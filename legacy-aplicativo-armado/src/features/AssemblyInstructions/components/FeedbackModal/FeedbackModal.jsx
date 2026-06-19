import React, { useState, useCallback } from 'react';
import './FeedbackModal.css';

/* ─────────────────────────────────────────────
   Constantes
   ───────────────────────────────────────────── */
const NEGATIVE_TAGS = [
  'Piezas confusas',
  'Audio incompleto',
  'Tornillos erróneos',
  'Manual muy largo',
  'No entendí un paso',
];

const MAX_COMMENT_LENGTH = 500;

/* ─────────────────────────────────────────────
   Componente SVG de estrella
   ───────────────────────────────────────────── */
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   FeedbackModal
   ───────────────────────────────────────────── */

/**
 * @param {Object}   props
 * @param {boolean}  props.isOpen    - Controla la visibilidad del modal
 * @param {Function} props.onSubmit  - Callback({ rating, tags, comment })
 * @param {Function} props.onClose   - Callback para cerrar / omitir
 */
export default function FeedbackModal({ isOpen, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');

  /* ── Handlers ── */
  const handleStarClick = useCallback((star) => {
    setRating(star);
    // Limpiar tags si la nueva calificación es > 3
    if (star > 3) setSelectedTags([]);
  }, []);

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleCommentChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= MAX_COMMENT_LENGTH) {
      setComment(value);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    onSubmit({
      rating,
      tags: rating <= 3 ? selectedTags : [],
      comment: comment.trim(),
    });
  }, [rating, selectedTags, comment, onSubmit]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  /* ── Guard ── */
  if (!isOpen) return null;

  /* ── Render ── */
  const showTags = rating > 0 && rating <= 3;

  return (
    <div className="feedback-overlay" onClick={handleOverlayClick}>
      <div className="feedback-card">
        {/* Título */}
        <h2 className="feedback-title">¿Cómo estuvo el manual?</h2>
        <p className="feedback-subtitle">Tu opinión nos ayuda a mejorar</p>

        {/* Estrellas */}
        <div className="feedback-stars">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= rating;
            const isHovered = star <= hoveredStar;
            return (
              <span
                key={star}
                className={`feedback-star${isActive ? ' active' : ''}${isHovered && !isActive ? ' hover' : ''}`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                role="button"
                aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleStarClick(star);
                }}
              >
                <StarIcon />
              </span>
            );
          })}
        </div>

        {/* Tags condicionales (solo si rating ≤ 3) */}
        {showTags && (
          <div className="feedback-tags-section">
            <p className="feedback-tags-label">¿Qué podemos mejorar?</p>
            <div className="feedback-tags">
              {NEGATIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`feedback-tag${selectedTags.includes(tag) ? ' selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comentario opcional */}
        <textarea
          className="feedback-comment"
          placeholder="Cuéntanos más (opcional)..."
          value={comment}
          onChange={handleCommentChange}
          maxLength={MAX_COMMENT_LENGTH}
        />
        <div className="feedback-char-count">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </div>

        {/* Acciones */}
        <div className="feedback-actions">
          <button
            className="feedback-submit"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Enviar
          </button>
          <button className="feedback-skip" onClick={onClose}>
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
}
