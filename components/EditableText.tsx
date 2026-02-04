'use client';

import { useState, useEffect } from 'react';

interface EditableTextProps {
  id: string;
  defaultText: string;
  className?: string;
}

export default function EditableText({ id, defaultText, className = '' }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(defaultText);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Charger le texte du localStorage (valide pour localhost ET production)
    const saved = localStorage.getItem(`editable-text-${id}`);
    if (saved) {
      setText(saved);
    }

    // Vérifier si on est en localhost
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    setIsLocalhost(isLocal);
    setIsLoaded(true);
  }, [id]);

  const handleSave = () => {
    localStorage.setItem(`editable-text-${id}`, text);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText(localStorage.getItem(`editable-text-${id}`) || defaultText);
    setIsEditing(false);
  };

  if (!isLoaded) {
    return <p className={className}>{text}</p>;
  }

  // En production: afficher juste le texte
  if (!isLocalhost) {
    return <p className={className}>{text}</p>;
  }

  // En localhost: mode édition activé
  if (isEditing) {
    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            border: '2px solid #0ea5e9',
            borderRadius: '4px',
            resize: 'vertical'
          }}
        />
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleSave}
            style={{
              padding: '6px 12px',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ✓ Sauvegarder
          </button>
          <button 
            onClick={handleCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ccc',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ✕ Annuler
          </button>
        </div>
      </div>
    );
  }

  // En localhost: affichage avec possibilité d'éditer
  return (
    <p 
      className={className}
      onClick={() => setIsEditing(true)}
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      title="Cliquez pour éditer (localhost uniquement)"
    >
      {text}
    </p>
  );
}
