(function () {
    "use strict";
    if (!window.__LUMINOVA || !window.React || !window.ReactDOM) return;

    const { useState, useEffect } = window.React;
    const html = window.htm.bind(window.React.createElement);

    // ═══════════════════════════════════════════════════════════════
    //  Luminova Smart File Viewer
    //
    //  Architecture Decision:
    //  Articulate Storyline has an internal JS scaler that locks onto
    //  a 16:9 (or 4:3) aspect ratio. When the iframe viewport is TALLER
    //  than the course ratio, Articulate letterboxes — leaving dead space.
    //
    //  Solution: Drive the iframe wrapper with `aspect-ratio: 16/9`.
    //  The modal becomes a floating lightbox that HUGS the content.
    //    • Mobile (375px): modal ≈ 375 × (211 + 52) = 263px tall → neat popup
    //    • Desktop (1280px): modal ≈ 1280 × (720 + 52) = 772px tall → windowed
    //  Articulate fills its iframe 100% — zero dead space.
    // ═══════════════════════════════════════════════════════════════

    const FullscreenViewerApp = () => {
        const [url,  setUrl]  = useState(null);
        const [lang, setLang] = useState('ar');

        useEffect(() => {
            const syncLang = () =>
                setLang(document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ar');
            syncLang();
            const obs = new MutationObserver(syncLang);
            obs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

            const handleOpen = (e) => { if (e.detail) setUrl(e.detail); };
            window.addEventListener('openFullscreen', handleOpen);

            return () => {
                window.removeEventListener('openFullscreen', handleOpen);
                obs.disconnect();
            };
        }, []);

        if (!url) return null;

        const isLocal = url.startsWith('file://') ||
            (!url.startsWith('http') && !url.startsWith('data:') &&
             !url.startsWith('blob:') && !url.startsWith('//'));

        const close = () => setUrl(null);

        // ── Shared Styles ────────────────────────────────────────────────
        const overlayStyle = {
            position:   'fixed',
            inset:      0,
            zIndex:     999999,
            background: 'rgba(9,9,11,0.95)',
            backdropFilter:         'blur(14px)',
            WebkitBackdropFilter:   'blur(14px)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:    '16px',
            fontFamily: 'Cairo, sans-serif',
        };

        // Modal: auto-height — grows from header + content, capped at 92dvh
        const modalStyle = {
            display:        'flex',
            flexDirection:  'column',
            width:          'min(95vw, 1280px)',
            maxHeight:      'min(92dvh, 92vh)',   // dvh with vh fallback
            borderRadius:   '16px',
            overflow:       'hidden',
            boxShadow:      '0 40px 100px rgba(0,0,0,0.85)',
            background:     'rgba(24,24,27,0.8)',
            border:         '1px solid rgba(255,255,255,0.1)',
        };

        const headerStyle = {
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            height:         '52px',
            padding:        '0 18px',
            background:     'transparent',
            borderBottom:   '1px solid rgba(255,255,255,0.08)',
            flexShrink:     0,
            gap:            '10px',
        };

        const closeBtnStyle = {
            background:   '#ef4444',
            color:        '#fff',
            border:       'none',
            padding:      '6px 16px',
            borderRadius: '8px',
            fontWeight:   900,
            cursor:       'pointer',
            fontSize:     '0.85rem',
            flexShrink:   0,
            transition:   'background 0.15s',
        };

        // ── iframe wrapper uses 16:9 aspect-ratio ─────────────────────
        // Articulate's scaler FILLS a 16:9 viewport → zero letterboxing
        // maxHeight guard prevents overflow on very short screens
        const iframeWrapStyle = {
            width:      '100%',
            aspectRatio: '16 / 9',
            maxHeight:  'calc(min(92dvh,92vh) - 52px)',
            position:   'relative',
            background: '#020617',   // near-black: any micro-gap = invisible
            flexShrink: 0,
        };

        const iframeStyle = {
            position: 'absolute',
            inset:    0,
            width:    '100%',
            height:   '100%',
            border:   'none',
            display:  'block',
        };

        // ── Local file notice ─────────────────────────────────────────
        const localWrapStyle = {
            ...iframeWrapStyle,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '20px',
            padding:        '32px',
            textAlign:      'center',
            background:     'linear-gradient(135deg, rgba(244,63,94,0.1) 0%, rgba(79,70,229,0.1) 100%)',
        };

        return html`
        <div style=${overlayStyle}
             onClick=${(e) => { if (e.target === e.currentTarget) close(); }}>

            <div style=${modalStyle}>

                <!-- ── Header ── -->
                <div style=${headerStyle}>
                    <span style=${{ color: '#94a3b8', fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        📄 ${lang === 'ar' ? 'عارض الملفات' : 'File Viewer'}
                    </span>
                    <button style=${closeBtnStyle}
                            onClick=${close}
                            onMouseEnter=${(e) => e.currentTarget.style.background = '#dc2626'}
                            onMouseLeave=${(e) => e.currentTarget.style.background = '#ef4444'}>
                        ${lang === 'ar' ? 'رجوع ✖' : 'Close ✖'}
                    </button>
                </div>

                <!-- ── Content ── -->
                ${isLocal ? html`

                    <div style=${localWrapStyle}>
                        <div style=${{ fontSize: '56px', lineHeight: 1 }}>📄</div>
                        <div>
                            <h2 style=${{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.2rem', margin: '0 0 8px' }}>
                                ${lang === 'ar' ? 'ملف محلي' : 'Local File'}
                            </h2>
                            <p style=${{ color: '#94a3b8', fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                                ${lang === 'ar'
                                    ? 'لا يمكن تضمين الملفات المحلية داخل الصفحة.'
                                    : 'Local files cannot be embedded directly.'}
                            </p>
                        </div>
                        <a href=${url} target="_blank" rel="noopener noreferrer"
                           style=${{
                               display: 'inline-flex', alignItems: 'center', gap: '8px',
                               background: 'linear-gradient(135deg, #fb7185, #818cf8)',
                               color: '#fff', padding: '12px 28px', borderRadius: '12px',
                               fontWeight: 900, fontSize: '0.95rem', textDecoration: 'none',
                               boxShadow: '0 6px 20px rgba(244,63,94,0.3)',
                           }}>
                            <span>↗</span>
                            <span>${lang === 'ar' ? 'فتح في المتصفح' : 'Open in Browser'}</span>
                        </a>
                    </div>

                ` : html`

                    <!-- ── Adaptive iframe ── -->
                    <!-- aspectRatio:16/9 = Articulate fills 100%, NO dead space -->
                    <div style=${iframeWrapStyle}>
                        <iframe
                            src=${url}
                            style=${iframeStyle}
                            sandbox="allow-scripts allow-popups allow-same-origin allow-forms allow-downloads"
                        ></iframe>
                    </div>

                `}
            </div>
        </div>
        `;
    };

    const container = document.createElement('div');
    container.id = 'luminova-viewer-portal';
    document.body.appendChild(container);
    window.ReactDOM.createRoot(container).render(html`<${FullscreenViewerApp} />`);
    window.__LUMINOVA.Pages.FullscreenViewer = FullscreenViewerApp;

})();
