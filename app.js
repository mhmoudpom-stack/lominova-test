(function () {
    // ==========================================
    // PART 1: Core Utilities, i18n, Icons, Atoms
    // ==========================================
    var { useState, useEffect, useMemo, useCallback } = window.React;
    var html = window.htm.bind(window.React.createElement);

    window.__LUMINOVA = { Core: {}, Components: {}, Pages: {}, Icons: {} };
    const Luminova = window.__LUMINOVA;

    Luminova.FOUNDER = {
        id: 's_founder_hardcoded', nameAr: 'محمود عبد الرحمن عبدالله', nameEn: 'Mahmoud Abdelrahman', isFounder: true, isVIP: true, isVerified: true,
        image: 'img/profile.png', majorAr: 'تكنولوجيا التعليم', majorEn: 'Educational Technology',
        socialLinks: { facebook: 'https://www.facebook.com/mahmoud.abdalrahaman.hagag', instagram: 'https://www.instagram.com/mahmoud_abdelrhman_1', linkedin: 'https://www.linkedin.com/in/mahmoud-hagag-145127346/' }
    };

    Luminova.getStudent = (id, studentsList) => {
        if (!id) return { id: 'unknown', nameAr: 'غير معروف', nameEn: 'Unknown' };
        if (id === Luminova.FOUNDER.id || id === 's_founder' || id === 's_founder_hardcoded') return Luminova.FOUNDER;
        return (studentsList || []).find(s => s.id === id) || { id: 'unknown', nameAr: 'غير معروف', nameEn: 'Unknown' };
    };

    Luminova.i18n = {
        ar: {
            appName: "Luminova Edu", home: "الرئيسية", community: "مجتمع الطلاب", academic: "المكتبة الأكاديمية",
            founder: "المؤسس", vip: "مميز", verified: "موثوق", doctor: "دكتور",
            readMore: "عرض المزيد", readLess: "عرض أقل", searchPlaceholder: "ابحث هنا...", emptyState: "لا يوجد بيانات لعرضها.",
            years: "الفرق الدراسية", semesters: "الفصول الدراسية", subjects: "المواد الدراسية",
            summaries: "التلخيصات", quizzes: "الاختبارات", startQuiz: "بدء الاختبار", questions: "الأسئلة",
            quitWarning: "هل أنت متأكد من الخروج؟ سيتم فقدان التقدم.", score: "الدرجة",
            modelAnswer: "الإجابة النموذجية:", explanation: "التعليل:",
            deleteProtected: "لا يمكن الحذف.. الرجاء مسح المحتويات الداخلية أولاً",
            save: "حفظ", delete: "حذف", cancel: "إلغاء", exportData: "سحب الكود (Export initialData)",
            major: "التخصص", correct: "إجابة صحيحة", wrong: "إجابة خاطئة", results: "النتائج",
            topContributors: "شرف المساهمين 🏆", news: "أحدث الأخبار 📢", feed: "الخلاصة 🔥",
            certificates: "الشهادات والتوثيق"
        },
        en: {
            appName: "Luminova Edu", home: "Home", community: "Community", academic: "Academic Library",
            founder: "Founder", vip: "VIP", verified: "Verified", doctor: "Doctor",
            readMore: "Read More", readLess: "Read Less", searchPlaceholder: "Search...", emptyState: "No data available.",
            years: "Academic Years", semesters: "Semesters", subjects: "Subjects",
            summaries: "Summaries", quizzes: "Quizzes", startQuiz: "Start Quiz", questions: "Questions",
            quitWarning: "Are you sure you want to quit? Progress will be lost.", score: "Score",
            modelAnswer: "Model Answer:", explanation: "Explanation:",
            deleteProtected: "Cannot delete. Please remove inner contents first.",
            save: "Save", delete: "Delete", cancel: "Cancel", exportData: "Export initialData Code",
            major: "Major", correct: "Correct", wrong: "Wrong", results: "Results",
            topContributors: "Top Contributors 🏆", news: "Latest News 📢", feed: "The Feed 🔥",
            certificates: "Certificates Archive"
        }
    };

    Luminova.Icons = {
        User: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        Book: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
        Home: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        CheckCircle: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        XCircle: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        Trash: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        Edit: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
        Facebook: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
        Instagram: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
        LinkedIn: () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
        VerifiedBlue: () => html`<svg className="w-5 h-5 absolute bottom-0 right-0 z-10 translate-x-1/4 translate-y-1/4 shadow-sm bg-white rounded-full p-[1px]" viewBox="0 0 24 24" fill="#1D9BF0" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 12.5C22.5 11.95 22.05 11.5 21.5 11.5L20.67 11.33C20.62 10.5 20.35 9.72 19.92 9L20.44 8.27C20.76 7.82 20.68 7.18 20.25 6.75L17.25 3.75C16.82 3.32 16.18 3.24 15.73 3.56L15 4.08C14.28 3.65 13.5 3.38 12.67 3.33L12.5 2.5C12.5 1.95 12.05 1.5 11.5 1.5H8.5C7.95 1.5 7.5 1.95 7.5 2.5L7.33 3.33C6.5 3.38 5.72 3.65 5 4.08L4.27 3.56C3.82 3.24 3.18 3.32 2.75 3.75L-0.25 6.75C-0.68 7.18 -0.76 7.82 -0.44 8.27L0.08 9C-0.35 9.72 -0.62 10.5 -0.67 11.33L-0.5 11.5C-0.5 12.05 -0.05 12.5 0.5 12.5H0.67C0.62 13.33 0.89 14.11 1.32 14.84L0.8 15.56C0.48 16.02 0.56 16.65 0.99 17.08L3.99 20.08C4.42 20.51 5.06 20.59 5.51 20.27L6.23 19.75C6.96 20.18 7.74 20.45 8.57 20.5L8.74 21.33C8.74 21.88 9.19 22.33 9.74 22.33H12.74C13.29 22.33 13.74 21.88 13.74 21.33L13.91 20.5C14.74 20.45 15.52 20.18 16.25 19.75L16.97 20.27C17.42 20.59 18.06 20.51 18.49 20.08L21.49 17.08C21.92 16.65 22.01 16.02 21.68 15.56L21.17 14.84C21.59 14.11 21.87 13.33 21.91 12.5H22.5ZM10.54 16.14L6.28 11.88L8.04 10.12L10.54 12.6L16.48 6.66L18.24 8.42L10.54 16.14Z" fill="white"/><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#1D9BF0"/><path d="M16.966 8.404L10.3702 15L7.03403 11.6667L8.44825 10.2525L10.3702 12.1744L15.5518 6.98978L16.966 8.404Z" fill="white"/></svg>`
    };

    Luminova.Components = {};

    Luminova.Components.GlassCard = ({ children, className = "", onClick = null }) => {
        return html`
        <div onClick=${onClick} className=${`glass-card p-6 rounded-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}>
            ${children}
        </div>
    `;
    };

    Luminova.Components.SmartText = ({ text, lang = 'ar', maxLength = 150 }) => {
        const [expanded, setExpanded] = useState(false);
        if (!text) return null;
        const isLong = text.length > maxLength;
        return html`<div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className=${`whitespace-pre-line smart-text ${expanded ? 'expanded' : 'collapsed'}`}>
                ${expanded ? text : text.substring(0, maxLength) + (isLong ? '...' : '')}
            </p>
            ${isLong && html`
                <button onClick=${(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="inline-flex items-center mt-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-xs transition-all border border-zinc-300 dark:border-zinc-700 cursor-pointer">
                    ${expanded ? Luminova.i18n[lang].readLess : Luminova.i18n[lang].readMore}
                </button>
            `}
        </div>
    `;
    };

    Luminova.Components.SmartMedia = ({ url, lang = 'ar' }) => {
        if (!url || (Array.isArray(url) && url.length === 0)) return null;

        const rawUrls = Array.isArray(url) ? url : [url];
        
        // 1. Normalize mixed arrays (strings/objects)
        // 2. Sort by custom order logically
        const sortedItems = rawUrls.map((item, idx) => {
            if (typeof item === 'string') return { url: item, titleAr: '', titleEn: '', order: idx, type: 'legacy' };
            return { ...item, order: item.order !== undefined ? item.order : idx };
        }).sort((a, b) => (a.order || 0) - (b.order || 0));

        return html`
        <div className="mt-6 w-full relative group space-y-10">
            <div className="absolute -inset-1 bg-zinc-500/5 rounded-2xl blur transition duration-1000 group-hover:bg-zinc-500/10 -z-10"></div>
            ${sortedItems.map((item, idx) => {
                if (!item || !item.url) return null;
                let embedContent = null;
                let urlStr = typeof item.url === 'string' ? item.url : String(item.url);
                const isBase64 = urlStr.startsWith('data:');
                const mimeMatch = isBase64 ? urlStr.match(/data:(.*?);/) : null;
                const mimeType = mimeMatch ? mimeMatch[1] : '';

                // Universal parsing logic: Treat non-http, non-data strings as relative paths
                const isRelative = !urlStr.startsWith('http') && !urlStr.startsWith('data:') && !urlStr.startsWith('blob:') && !urlStr.startsWith('file://');

                // Regex Rules
                const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                const ytMatch = urlStr.match(ytRegex);

                if (ytMatch && ytMatch[1]) {
                    const videoId = ytMatch[1];
                    embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${`https://www.youtube.com/embed/${videoId}` || 'about:blank'} title="YouTube" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" className="w-full h-[400px] border-none rounded-xl shadow-lg" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}</a>
                        </div>`;
                } else if (urlStr.includes('drive.google.com')) {
                    const driveId = urlStr.match(/[-\w]{25,}/);
                    embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${(driveId ? `https://drive.google.com/file/d/${driveId}/preview` : 'about:blank')} width="100%" height="500" allow="autoplay" className="rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}</a>
                        </div>`;
                } else if (urlStr.includes('docs.google.com/forms')) {
                    embedContent = html`
                        <div className="w-full">
                            <iframe loading="lazy" src=${urlStr || 'about:blank'} width="100%" height="600" frameBorder="0" marginHeight="0" marginWidth="0" className="rounded-xl shadow-lg bg-white" allowFullScreen></iframe>
                            <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}</a>
                        </div>`;
                } else if (urlStr.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('image/'))) {
                    embedContent = html`<div style=${{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }} className="w-full mb-4">
                        <img loading="lazy" src=${urlStr} alt="Smart Media" className="shadow-lg mx-auto rounded-xl cursor-pointer" onClick=${() => window.dispatchEvent(new CustomEvent('openFullscreen', { detail: urlStr }))} style=${{ maxHeight: '400px', maxWidth: '100%', width: 'auto', objectFit: 'contain' }} />
                    </div>`;
                } else if (urlStr.match(/\.(mp3|wav|ogg)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('audio/'))) {
                    embedContent = html`<audio controls className="w-full shadow-sm rounded-xl mb-4 bg-zinc-50 dark:bg-zinc-900 p-2"><source src=${urlStr} type=${isBase64 ? mimeType : `audio/${urlStr.split('.').pop().split('?')[0]}`} />متصفحك لا يدعم تشغيل الصوت.</audio>`;
                } else if (urlStr.match(/\.(mp4|webm)(\?.*)?$/i) || (isBase64 && mimeType.startsWith('video/'))) {
                    embedContent = html`<video controls className="w-full max-h-[500px] rounded-xl bg-black shadow-lg mb-4"><source src=${urlStr} type=${isBase64 ? mimeType : `video/${urlStr.split('.').pop().split('?')[0]}`} />متصفحك لا يدعم تشغيل الفيديو.</video>`;
                } else if (urlStr.match(/\.pdf(\?.*)?$/i) || (isBase64 && mimeType === 'application/pdf')) {
                    embedContent = html`<iframe src=${urlStr} width="100%" height="800px" style=${{ minHeight: '80vh' }} className="rounded-xl shadow-sm bg-white border border-zinc-200 dark:border-zinc-800" frameBorder="0" title="PDF Viewer"></iframe>`;
                } else {
                    // Handle HTML and generic unknown links
                    const isLocalHtml = urlStr.toLowerCase().endsWith('.html') || (isBase64 && mimeType === 'text/html');
                    const isLocalFallback = urlStr.startsWith('file://') || isRelative;

                    if (isLocalHtml) {
                        embedContent = html`
                        <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 mb-4 relative z-10 w-full hover:shadow-md transition-all">
                            <iframe
                                src=${urlStr}
                                className="w-full h-[400px] border-none bg-white"
                                sandbox="allow-scripts allow-popups allow-same-origin allow-forms"
                            ></iframe>
                            <div className="flex w-full divide-x divide-zinc-700 rtl:divide-x-reverse border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick=${() => window.dispatchEvent(new CustomEvent('openFullscreen', { detail: urlStr }))}
                                    className="flex-1 py-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-black transition-all flex items-center justify-center gap-2 border-none"
                                >
                                    <span className="text-xl leading-none">⛶</span>
                                    <span>${lang === 'ar' ? 'تكبير' : 'Enlarge'}</span>
                                </button>
                                <a
                                    href=${urlStr}
                                    target="_blank"
                                    className="flex-1 py-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-black transition-all flex items-center justify-center gap-2 no-underline"
                                >
                                    <span>${lang === 'ar' ? 'فتح بصفحة جديدة' : 'New Tab'}</span>
                                    <span className="text-xl leading-none">↗</span>
                                </a>
                            </div>
                        </div>
                        `;
                    } else if (isLocalFallback) {
                        embedContent = html`
                        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 mb-4 relative z-10 w-full">
                            <div className="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 bg-zinc-50 dark:bg-zinc-900">
                                <span style=${{ fontSize:'40px', lineHeight:1 }}>📁</span>
                                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 text-center">${lang === 'ar' ? 'مرفق محلي' : 'Local Attachment'}</p>
                                <a href=${urlStr} target="_blank" className="mt-4 px-6 py-2 bg-brand-DEFAULT text-white rounded-full font-bold shadow-md hover:bg-brand-hover transition-colors">
                                    ${lang === 'ar' ? 'تنزيل / عرض الملف' : 'Download / View File'}
                                </a>
                            </div>
                        </div>
                        `;
                    } else {
                        // General fallback for unknown web URLs
                        embedContent = html`
                        <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 mb-4 relative z-10 w-full">
                            <iframe
                                src=${urlStr}
                                className="w-full h-[400px] border-none bg-white"
                                sandbox="allow-scripts allow-popups allow-same-origin allow-forms"
                            ></iframe>
                            <div className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                                <a href=${urlStr} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">
                                    ${lang === 'ar' ? 'فتح الرابط بالخارج ↗' : 'Open Link Externally ↗'}
                                </a>
                            </div>
                        </div>
                        `;
                    }
                }
                
                const activeTitle = lang === 'ar' ? (item.titleAr || item.titleEn || item.title) : (item.titleEn || item.titleAr || item.title);
                const customTitle = typeof activeTitle === 'string' ? activeTitle.trim() : '';
                let titleBadge = null;
                
                if (customTitle) {
                    const isArabicLang = lang === 'ar';
                    const positionClass = isArabicLang ? "absolute -top-5 right-4 sm:right-6" : "absolute -top-5 left-4 sm:left-6";
                    const dirAttr = isArabicLang ? "rtl" : "ltr";
                    
                    // Luxurious Nano Banana Pill Badge Overlay
                    titleBadge = html`
                    <div className=${`${positionClass} z-20 pointer-events-none`} dir=${dirAttr}>
                        <div className="backdrop-blur-md bg-zinc-900/80 dark:bg-black/80 border border-white/10 dark:border-white/5 shadow-sm rounded-xl px-4 py-2 flex items-center gap-3">
                            <span className="text-zinc-400 text-lg">✨</span>
                            <span className="text-white font-bold text-sm tracking-wide truncate max-w-[200px] sm:max-w-md drop-shadow-sm flex-1" style=${{ direction: 'auto' }} title=${customTitle}>${customTitle}</span>
                        </div>
                    </div>`;
                }

                const padClass = titleBadge ? 'pt-2' : '';
                return html`<div key=${item.id || item.url || idx} className=${`w-full block relative hover:scale-[1.01] transition-transform duration-300 ${padClass}`}>${titleBadge}${embedContent}</div>`;
            })}
        </div>
    `;
    };

    
    Luminova.Components.SummaryCard = ({ item: rawItem, data, lang, onClose }) => {
        if (!rawItem) return null;
        const item = typeof rawItem === 'object' ? rawItem : ((data.summaries || []).find(s => s.id === rawItem) || (data.news || []).find(s => s.id === rawItem));
        if (!item) return html`<div className="text-center py-20 font-bold opacity-50">Content not found.</div>`;
        const author = Luminova.getStudent(item.studentId, data.students);
        const currentUrls = item.mediaUrls || (item.mediaUrl ? [item.mediaUrl] : []);

        return html`
        <div className="animate-fade-in relative max-w-4xl mx-auto pb-20 mt-4 xl:mt-8 px-2 sm:px-4">
            <button onClick=${onClose} className="mb-6 flex items-center gap-2 text-fuchsia-100/60 hover:text-white font-bold transition-colors bg-white/[0.03] backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                <span className="text-xl">${lang === 'ar' ? '←' : '→'}</span>
                <span>${lang === 'ar' ? 'الرجوع للقائمة' : 'Back to Feed'}</span>
            </button>
            
            ${author && author.id !== 'unknown' && html`
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-[2rem] p-4 sm:p-6 border border-white/10 flex items-center gap-4 mb-8 shadow-2xl">
                    <${Luminova.Components.Avatar} name=${author.nameAr || author.name} image=${author.image} isVIP=${author.isVIP} isVerified=${author.isVerified} isFounder=${author.isFounder} size="w-14 h-14 sm:w-20 sm:h-20 shrink-0 border-4 border-white/5 shadow-xl" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-black text-lg sm:text-2xl text-white drop-shadow-sm truncate max-w-full">${lang === 'ar' ? (author.nameAr || author.name) : (author.nameEn || author.name)}</h3>
                            ${author.isVIP && html`<span className="text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)] shrink-0">VIP ✨</span>`}
                            ${author.isFounder && html`<span className="text-[10px] bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white shadow-lg px-2.5 py-0.5 rounded-full font-black tracking-widest shrink-0 uppercase">${Luminova.i18n[lang].founder}</span>`}
                            ${!author.isFounder && author.role === 'doctor' && html`<span className="text-xs bg-teal-500/20 text-teal-400 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-black tracking-widest shrink-0">🎓 ${lang === 'ar' ? 'دكتور' : 'Doctor'}</span>`}
                        </div>
                        <p className="text-sm font-bold text-fuchsia-100/40 font-mono">${Luminova.formatDate(item.timestamp, lang)}</p>
                    </div>
                </div>
            `}

            <div className="mb-12 px-2 sm:px-6">
                <h1 className="text-3xl sm:text-5xl font-black mb-6 leading-tight text-white drop-shadow-md">${item[`title${lang === 'ar' ? 'Ar' : 'En'}`] || item.titleAr || item.titleEn || item.title}</h1>
                <p className="whitespace-normal break-words text-lg sm:text-xl opacity-80 leading-relaxed font-semibold text-zinc-600 dark:text-zinc-400" style=${{ overflowWrap: 'anywhere', wordBreak: 'normal' }}>
                    ${item[`content${lang === 'ar' ? 'Ar' : 'En'}`] || item.contentAr || item.contentEn || item.text}
                </p>
            </div>

            ${currentUrls.length > 0 && html`
                <div className="space-y-12 bg-zinc-50/50 dark:bg-zinc-900/30 p-2 sm:p-8 rounded-3xl">
                    <div className="flex items-center gap-3 mb-8 px-4 sm:px-0">
                        <span className="text-3xl">📎</span>
                        <h3 className="text-2xl font-black text-zinc-700 dark:text-zinc-300">${lang === 'ar' ? 'المرفقات والشروحات' : 'Attachments & Media'}</h3>
                    </div>
                    ${currentUrls.map((mUrl, i) => html`
                        <div key=${mUrl.url || mUrl.id || i} className="relative z-10 w-full hover:scale-[1.01] transition-transform duration-300">
                            ${currentUrls.length > 1 && html`<div className="absolute -top-4 -start-4 w-10 h-10 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-black rounded-full flex items-center justify-center shadow-sm border-4 border-white dark:border-zinc-900 z-20">${i + 1}</div>`}
                            <${Luminova.Components.SmartMedia} url=${mUrl} lang=${lang} />
                        </div>
                    `)}
                </div>
            `}
        </div>
        `;
    };

    Luminova.Components.Avatar = ({ name = "", nameEn = "", image = "", isVIP = false, isVerified = false, isFounder = false, size = "w-12 h-12" }) => {
        const getInitials = () => {
            // Enforce pulling from English name strictly if missing image 
            const targetName = (nameEn && nameEn.trim() !== '') ? nameEn : "ST";
            const words = targetName.trim().split(' ').filter(w => w);
            return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : targetName.substring(0, 2).toUpperCase();
        };
        return html`
        <div className="relative inline-block">
            <div className=${`relative ${size} flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-lg overflow-hidden
                ${isFounder ? 'founder-card text-zinc-300 bg-black' : isVIP ? 'bg-zinc-700' : 'bg-zinc-600'}`}>
                ${image ? html`<img src=${image} alt=${name} className="w-full h-full object-cover rounded-full" />` : getInitials()}
            </div>
            ${isVerified && !isFounder && html`<${Luminova.Icons.VerifiedBlue} />`}
        </div>
    `;
    };

    Luminova.Components.Input = ({ label, val, onChange, type = "text", placeholder = "" }) => {
        return html`
        <div className="mb-4 w-full">
            <label className="block text-sm font-black mb-2 opacity-80">${label}</label>
            ${type === 'checkbox' ? html`
                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-zinc-900 p-3 rounded-xl border dark:border-zinc-800 shadow-sm w-max">
                    <input type="checkbox" checked=${val || false} onChange=${(e) => onChange(e.target.checked)} className="w-6 h-6 accent-brand-DEFAULT rounded" />
                    <span className="font-bold">${label}</span>
                </label>
            ` : type === 'textarea' ? html`
                <textarea value=${val || ''} onChange=${(e) => onChange(e.target.value)} placeholder=${placeholder} className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border-2 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none shadow-sm min-h-[120px]" />
            ` : html`
                <input type=${type} value=${val || ''} onChange=${(e) => onChange(e.target.value)} placeholder=${placeholder} className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border-2 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none shadow-sm font-bold text-lg" />
            `}
        </div>
    `;
    };

    Luminova.Components.SocialInput = ({ label, val, onChange }) => {
        return html`
        <div className="mb-4 w-full">
            <label className="block text-sm font-black mb-2 opacity-80">${label}</label>
            <input type="url" value=${val || ''} onChange=${(e) => onChange(e.target.value)} className="w-full p-4 rounded-xl bg-white/50 dark:bg-zinc-900 border-2 border-dashed dark:border-zinc-800 focus:border-blue-600 outline-none shadow-sm" placeholder="URL Link" />
        </div>
    `;
    };

    Luminova.Components.FileInput = ({ label, onFileLoaded, accept = "*/*" }) => {
        return html`
        <div className="mb-4 w-full">
            <label className="block text-sm font-black mb-2 opacity-80">${label}</label>
            <input type="file" accept=${accept} onChange=${(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => onFileLoaded(event.target.result);
                reader.readAsDataURL(file);
            }} className="w-full text-sm font-bold p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed dark:border-gray-700 focus:border-brand-DEFAULT outline-none cursor-pointer file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-DEFAULT file:text-white hover:file:bg-brand-hover transition-all shadow-sm" />
        </div>
    `;
    };

    Luminova.Components.SingleMediaRow = ({ val, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, idx }) => {
        const isLegacyString = typeof val === 'string';
        const urlStr = isLegacyString ? val : (val?.url || '');
        const titleAr = isLegacyString ? '' : (val?.titleAr || val?.title || '');
        const titleEn = isLegacyString ? '' : (val?.titleEn || '');
        const currentOrder = isLegacyString ? idx : (val?.order !== undefined ? val.order : idx);
        
        const initialType = urlStr ? (String(urlStr).startsWith('data:') ? 'base64' : (!String(urlStr).startsWith('http') ? 'local' : 'url')) : 'url';
        const [inputType, setInputType] = useState(initialType);
        
        const emitChange = (newUrl, newTitleAr, newTitleEn) => {
            onChange({ url: newUrl, titleAr: newTitleAr, titleEn: newTitleEn, order: currentOrder, type: inputType });
        };
        
        let inputContent = null;
        if (inputType === 'url') {
            inputContent = html`<${Luminova.Components.Input} label="رابط مباشر (URL YouTube, Drive, Image...)" val=${urlStr} onChange=${v => emitChange(v, titleAr, titleEn)} />`;
        } else if (inputType === 'base64') {
            inputContent = html`
                <div className="mb-2 text-xs font-bold text-gray-400">سيتم حفظ الملف وتضمينه كـ Base64 ليعمل بدون إنترنت.</div>
                <${Luminova.Components.FileInput} label="رفع ملف (Upload File Base64)" accept="*/*" onFileLoaded=${v => emitChange(v, titleAr, titleEn)} />
            `;
        } else {
            inputContent = html`
                <div className="mb-2 text-xs font-bold text-gray-400">مثال: file-html/lesson1/index.html أو files/document.pdf </div>
                <${Luminova.Components.Input} label="مسار ملف محلي (Local Path)" placeholder="example/path/index.html" val=${urlStr} onChange=${v => emitChange(v, titleAr, titleEn)} />
            `;
        }

        return html`
        <div className="flex flex-col gap-2 p-4 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full hover:border-zinc-400/30 transition-colors">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
                <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shadow-inner">
                    <button onClick=${() => setInputType('url')} className=${`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${inputType === 'url' ? 'bg-brand-DEFAULT text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>رابط (URL)</button>
                    <button onClick=${() => setInputType('base64')} className=${`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${inputType === 'base64' ? 'bg-brand-DEFAULT text-white' : 'bg-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>ملف (Base64)</button>
                    <button onClick=${() => setInputType('local')} className=${`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${inputType === 'local' ? 'bg-brand-DEFAULT text-white' : 'bg-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>مسار محلي</button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 shadow-inner">
                        <button onClick=${onMoveUp} disabled=${isFirst} className="px-2 py-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-300 shadow-sm" title="تحريك لأعلى (Move Up)">↑</button>
                        <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>
                        <button onClick=${onMoveDown} disabled=${isLast} className="px-2 py-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-zinc-700 dark:text-zinc-300 shadow-sm" title="تحريك لأسفل (Move Down)">↓</button>
                    </div>
                    <button onClick=${onRemove} className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm transition-all border border-red-500/20" title="حذف المرفق">✖</button>
                </div>
            </div>
            <div className="w-full flex flex-col gap-4 mt-2">
                ${inputContent}
                <div className="w-full pl-0 flex flex-col md:flex-row gap-4 border-t border-brand-DEFAULT/10 pt-4 mt-2">
                    <div className="flex-1 border-l-4 border-brand-DEFAULT/30 pl-2 sm:pl-4">
                        <${Luminova.Components.Input} label="عنوان المرفق (عربي) - Optional" placeholder="مثال: فيديو شرح الدرس الأول..." val=${titleAr} onChange=${v => emitChange(urlStr, v, titleEn)} />
                    </div>
                    <div className="flex-1 border-l-4 border-brand-hover/30 pl-2 sm:pl-4">
                        <${Luminova.Components.Input} label="Custom Title (English) - Optional" placeholder="e.g. Lesson One Video..." val=${titleEn} onChange=${v => emitChange(urlStr, titleAr, v)} />
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    Luminova.Components.UniversalMediaInput = ({ attachments = [], onChange, label = "إرفاق وسائط (Media Attachments)" }) => {
        // Enforce array safely and normalize items structurally
        const rawItems = Array.isArray(attachments) ? attachments : (attachments ? [attachments] : []);
        
        const sortedItems = rawItems.map((item, index) => {
            if (typeof item === 'string') return { url: item, titleAr: '', titleEn: '', order: index, type: 'legacy' };
            return { ...item, order: item.order !== undefined ? item.order : index };
        }).sort((a, b) => (a.order || 0) - (b.order || 0));

        const handleMove = (currentIndex, direction) => {
            if (direction === 'up' && currentIndex === 0) return;
            if (direction === 'down' && currentIndex === sortedItems.length - 1) return;

            const newArray = [...sortedItems];
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            
            // Swap semantic orders logically
            const tempOrder = newArray[currentIndex].order;
            newArray[currentIndex].order = newArray[targetIndex].order;
            newArray[targetIndex].order = tempOrder;
            
            // Re-sort and dispatch to update state universally
            newArray.sort((a, b) => (a.order || 0) - (b.order || 0));
            onChange(newArray);
        };

        const renderedItems = sortedItems.map((val, idx) => {
            return html`<${Luminova.Components.SingleMediaRow} key=${idx} idx=${idx} val=${val}
                isFirst=${idx === 0} isLast=${idx === sortedItems.length - 1}
                onMoveUp=${() => handleMove(idx, 'up')}
                onMoveDown=${() => handleMove(idx, 'down')}
                onChange=${(newVal) => {
                    const newArr = [...sortedItems];
                    newArr[idx] = newVal;
                    onChange(newArr);
                }} 
                onRemove=${() => {
                    const newArr = sortedItems.filter((_, i) => i !== idx);
                    onChange(newArr);
                }} 
            />`;
        });

        return html`
        <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner w-full space-y-4">
            <h4 className="font-black text-brand-DEFAULT border-b border-brand-DEFAULT/20 dark:border-gray-700 pb-3 flex items-center gap-2"><span>📎</span> ${label} <span className="bg-brand-DEFAULT text-white px-2.5 py-0.5 rounded-full text-xs shadow-sm">${sortedItems.length}</span></h4>
            <div className="flex flex-col gap-4 w-full">
                ${renderedItems}
            </div>
            <div className="flex justify-center pt-4">
                <button onClick=${() => onChange([...sortedItems, { url: '', titleAr: '', titleEn: '', order: sortedItems.length }])} className="px-8 py-3 bg-brand-DEFAULT/10 hover:bg-brand-DEFAULT text-brand-DEFAULT hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-brand-DEFAULT/30 border-dashed hover:border-solid">
                    <span className="text-xl">➕</span> إضافة مرفق جديد (Add Media Attachment)
                </button>
            </div>
        </div>
        `;
    };

    Luminova.Components.Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }) => {
        const variants = {
            primary: "bg-brand-DEFAULT text-white hover:bg-brand-hover",
            danger: "bg-red-500 text-white hover:bg-red-600",
            glass: "glass-card text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        };
        return html`
        <button disabled=${disabled} onClick=${onClick} className=${`px-4 py-2 rounded-lg font-semibold transition-all shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}>
            ${children}
        </button>
    `;
    };

    Luminova.formatDate = (dateString, lang) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Loader component kept but no longer used in Suspense
    Luminova.Components.Loader = ({ lang = 'ar' }) => {
        return html`
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="w-16 h-16 border-4 border-brand-DEFAULT border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <p className="mt-6 text-xl font-bold opacity-80 text-brand-DEFAULT animate-pulse tracking-widest">${lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
        `;
    };

    Luminova.Components.CustomDropdown = ({ options, value, onChange, placeholder, className = "" }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(o => String(o.value) === String(value)) || null;
        
        return html`
        <div className=${`relative ${className}`}>
            <button onClick=${() => setIsOpen(!isOpen)} onBlur=${() => setTimeout(() => setIsOpen(false), 200)}
                className="w-full appearance-none bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 text-white rounded-2xl px-5 py-4 outline-none transition-all cursor-pointer shadow-sm font-bold flex justify-between items-center z-10 relative"
            >
                <span className=${selectedOption ? 'opacity-100' : 'opacity-70'}>
                    ${selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className=${`transition-transform duration-300 transform opacity-50 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            ${isOpen && html`
                <div className="absolute top-full left-0 right-0 mt-3 z-[999] animate-fade-in backdrop-blur-3xl bg-[#0A0514]/95 border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden max-h-[300px] overflow-y-auto">
                    <ul className="py-2 flex flex-col m-0 p-0">
                        ${options.map(opt => html`
                            <li key=${opt.value} 
                                onClick=${() => { onChange(opt.value); setIsOpen(false); }}
                                className=${`px-5 py-4 cursor-pointer transition-colors font-bold border-b border-white/5 last:border-none ${String(value) === String(opt.value) ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'}`}
                            >
                                ${opt.label}
                            </li>
                        `)}
                    </ul>
                </div>
            `}
        </div>
        `;
    };

    Luminova.Components.TabletPortraitOverlay = ({ lang }) => {
        const [showOverlay, setShowOverlay] = useState(false);
        const [ignoreOrientation, setIgnoreOrientation] = useState(false);

        useEffect(() => {
            const checkOrientation = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                // Target generic tablet boundaries in portrait (width between 768 and 1024, height > width)
                if (width >= 768 && width <= 1024 && height > width) {
                    setShowOverlay(true);
                } else {
                    setShowOverlay(false);
                }
            };
            checkOrientation();
            window.addEventListener('resize', checkOrientation);
            return () => window.removeEventListener('resize', checkOrientation);
        }, []);

        if (!showOverlay || ignoreOrientation) return null;

        return html`
            <div className="fixed inset-0 z-[11000] flex flex-col items-center justify-center p-6 backdrop-blur-xl bg-black/95 text-white animate-fade-in" dir=${lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col items-center text-center max-w-lg w-full">
                <!-- Rotating Tablet Icon CSS Animation -->
                <style>
                    ${`
                    @keyframes rotateTabletOS {
                        0% { transform: rotate(0deg) scale(1); }
                        25% { transform: rotate(90deg) scale(1.1); }
                        50% { transform: rotate(90deg) scale(1.1); box-shadow: 0 0 30px rgba(6,182,212,0.6); }
                        75% { transform: rotate(0deg) scale(1); }
                        100% { transform: rotate(0deg) scale(1); }
                    }
                    `}
                </style>
                <div style=${{ 
                    width: '120px', height: '170px', 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.5))',
                    border: '6px solid white', 
                    borderRadius: '16px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }} className="mb-8 relative animate-[rotateTabletOS_4s_cubic-bezier(0.4,0,0.2,1)_infinite]">
                    <!-- Tablet Home Button / Camera Indication -->
                    <div style=${{ width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '2px', position: 'absolute', bottom: '10px' }}></div>
                    <div style=${{ width: '8px', height: '8px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '50%', position: 'absolute', top: '10px' }}></div>
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-black mb-6 leading-tight text-white">
                    ${lang === 'ar' ? 'للحصول على أفضل تجربة تصفح، يرجى تدوير التابلت أو الآيباد إلى الوضع العرضي' : 'For the best browsing experience, please rotate your tablet/iPad to landscape mode'}
                </h2>
                <button onClick=${() => setIgnoreOrientation(true)} className="mt-8 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 text-xl">
                    ${lang === 'ar' ? 'إكمال على أي حال' : 'Continue anyway'}
                </button>
            </div>
        </div>
        `;
    };

    // END OF PART 1

    // ==========================================
    // PART 2: Lazy Pages + App Shell Router
    // (All pages loaded on-demand via changeView)
    // ==========================================


    const routeMap = {
        'home': 'js/pages/main-views.js',
        'community': 'js/pages/main-views.js',
        'academics': 'js/pages/main-views.js',
        'quiz': 'js/pages/quiz-engine.js',
        'certificates': 'js/pages/certificate-engine.js'
    };

    const App = () => {
        const fallbackData = window.initialData || window.LUMINOVA_DATA || {};

        // الاعتماد الحصري على data.js كمصدر وحيد وتجاهل التخزين المحلي
        // quizzes start as [] — exam.js is lazy-loaded in the background on mount
        const [data, setData] = useState(() => {
            return { ...fallbackData, quizzes: [] };
        });

        const [lang, setLang] = useState(data.settings?.language || 'ar');
        const [view, setView] = useState('home');
        const [previousView, setPreviousView] = useState('home');
        const [activeQuiz, setActiveQuiz] = useState(null);
        const [activeSummary, setActiveSummary] = useState(null);
        const [isNavigating, setIsNavigating] = useState(false);
        const [showSplash, setShowSplash] = useState(true);

        // Sentinel: true while a popstate-triggered navigation is in progress.
        // Prevents changeView from pushing a duplicate history entry.
        const isPopNavRef = window.React.useRef(false);

        // MUST be defined before any useEffect that calls it
        const changeView = useCallback(async (newView) => {
            if (routeMap[newView]) {
                setIsNavigating(true);
                try {
                    await new Promise((resolve, reject) => {
                        const existing = document.querySelector(`script[data-lmv-page="${newView}"]`);
                        if (existing) return resolve();
                        const script = document.createElement('script');
                        script.src = routeMap[newView] + '?v=2';
                        script.setAttribute('data-lmv-page', newView);
                        script.onload = resolve;
                        script.onerror = () => { console.error('Failed to load:', newView); resolve(); };
                        document.body.appendChild(script);
                    });
                } catch (error) {
                    console.error('Route load error:', error);
                }
                setIsNavigating(false);
            }

            // Shallow History: push state only for detail/overlay views, and only
            // when this navigation was NOT triggered by a popstate (back-button).
            const isDetailView = ['summaryDetail', 'quiz', 'certificates'].includes(newView);
            if (isDetailView && !isPopNavRef.current) {
                window.history.pushState({ lmv: newView }, '', '');
            }
            isPopNavRef.current = false; // reset sentinel after every navigation

            setView(prev => { setPreviousView(prev); return newView; });
        }, []);


        // Task 2: Scroll Restoration — scroll to top on every primary view change
        useEffect(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, [view]);

        useEffect(() => {
            const root = document.documentElement;
            if (data.settings?.theme === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
            root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
            root.setAttribute('lang', lang);
        }, [data.settings?.theme, lang]);

        useEffect(() => {
            const t = setTimeout(() => setShowSplash(false), 2500);
            return () => clearTimeout(t);
        }, []);

        // Shallow History: listen for hardware/browser back-button
        useEffect(() => {
            const onPopState = () => {
                isPopNavRef.current = true; // signal changeView to NOT push again
                // Dispatch a custom event that sub-pages (academics, community) can
                // listen to for closing their own internal detail views.
                const handled = window.dispatchEvent(new CustomEvent('lmv:popstate', { cancelable: true }));
                // If no sub-page cancelled the event, handle at top-level
                if (handled !== false) {
                    setView(prev => {
                        const detailViews = ['summaryDetail', 'quiz', 'certificates'];
                        if (detailViews.includes(prev)) {
                            // Return to the logical parent
                            if (prev === 'summaryDetail') return previousView !== 'summaryDetail' ? previousView : 'home';
                            if (prev === 'quiz') return 'academics';
                            if (prev === 'certificates') return 'home';
                        }
                        // Already on a root view — do nothing, let the browser handle normally
                        return prev;
                    });
                }
            };
            window.addEventListener('popstate', onPopState);
            return () => window.removeEventListener('popstate', onPopState);
        }, [previousView]);

        const handleLogoClick = () => {
            changeView('home');
        };

        const toggleTheme = () => {
            setData(prev => ({ ...prev, settings: { ...prev.settings, theme: prev.settings.theme === 'dark' ? 'light' : 'dark' } }));
        };

        const toggleLang = () => {
            const newLang = lang === 'ar' ? 'en' : 'ar';
            setLang(newLang);
            setData(prev => ({ ...prev, settings: { ...prev.settings, language: newLang } }));
        };

        useEffect(() => {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('verify')) {
                changeView('certificates');
            } else {
                changeView('home');
            }

            // Silently pre-fetch exam.js in the background after initial paint.
            // Uses a dedicated script-injection loader defined inside exam.js.
            const fetchExams = () => {
                if (window.LUMINOVA_EXAMS) {
                    // Already loaded (e.g. cached by browser)
                    setData(prev => ({ ...prev, quizzes: window.LUMINOVA_EXAMS }));
                    return;
                }
                const script = document.createElement('script');
                script.src = 'exam.js?v=2';
                script.setAttribute('data-lmv-page', 'exam');
                script.onload = () => {
                    setData(prev => ({ ...prev, quizzes: window.LUMINOVA_EXAMS || [] }));
                };
                script.onerror = () => console.warn('Luminova: exam.js failed to load.');
                document.body.appendChild(script);
            };
            fetchExams();
        }, []);

        const renderView = () => {
            switch (view) {
                case 'summaryDetail': return html`<${Luminova.Components.SummaryCard} item=${activeSummary} data=${data} lang=${lang} onClose=${() => window.history.back()} />`;
                case 'quiz': return Luminova.Pages.QuizEngine ? html`<${Luminova.Pages.QuizEngine} quiz=${activeQuiz} data=${data} lang=${lang} goBack=${() => window.history.back()} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                case 'community': return Luminova.Pages.StudentCommunityPage ? html`<${Luminova.Pages.StudentCommunityPage} data=${data} lang=${lang} setView=${changeView} setActiveSummary=${setActiveSummary} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                case 'academics': return Luminova.Pages.AcademicHierarchyPage ? html`<${Luminova.Pages.AcademicHierarchyPage} data=${data} lang=${lang} setView=${changeView} setActiveQuiz=${setActiveQuiz} setActiveSummary=${setActiveSummary} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                case 'certificates': return Luminova.Pages.CertificateArchivePage ? html`<${Luminova.Pages.CertificateArchivePage} lang=${lang} goBack=${() => window.history.back()} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
                default: return Luminova.Pages.HomePage ? html`<${Luminova.Pages.HomePage} data=${data} lang=${lang} setView=${changeView} setActiveSummary=${setActiveSummary} />` : html`<${Luminova.Components.Loader} lang=${lang} />`;
            }
        };

        return html`
        <div className="min-h-screen lmv-page-wrapper">
            <div className="ambient-glow"></div>

            <!-- Splash Screen Intro -->
            <div style=${{
                position: 'fixed', inset: 0, zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#020617',
                pointerEvents: showSplash ? 'all' : 'none',
                opacity: showSplash ? 1 : 0,
                transition: 'opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <div id="lmv-splash-content" style=${{
                    textAlign: 'center',
                    animation: 'lmv-splash-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                }}>
                    <p className="font-black tracking-tighter" style=${{
                        fontSize: '4.5rem',
                        background: 'linear-gradient(to bottom right, #fb7185, #e879f9, #818cf8)',
                        webkitBackgroundClip: 'text',
                        webkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        margin: 0,
                        lineHeight: 0.9,
                        filter: 'drop-shadow(0 0 20px rgba(244, 63, 94, 0.3))',
                    }}>LUMINOVA</p>
                    <p style=${{
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        color: 'rgba(148,163,184,0.7)',
                        fontSize: '0.8rem',
                        letterSpacing: '0.35em',
                        textTransform: 'uppercase',
                        marginTop: '12px',
                        fontWeight: 600,
                    }}>Educational Platform</p>
                </div>
                <style>@keyframes lmv-splash-in { from { opacity: 0; transform: scale(0.88) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }</style>
            </div>

            <!-- Task 4: Tablet Portrait Overlay -->
            <${Luminova.Components.TabletPortraitOverlay} lang=${lang} />



            ${view !== 'fullscreenViewer' && html`
                <!-- Slim loading bar at top (shown during page transitions) -->
                ${isNavigating ? html`<div key="loading-bar" className="lmv-loading-bar"></div>` : null}

                <nav key="top-nav" style=${{ position: 'sticky', top: 0, zIndex: 40 }} className="glass-card px-3 sm:px-8 py-3 sm:py-4 mb-10 flex items-center gap-2 rounded-none border-t-0 border-r-0 border-l-0 shadow-sm">

                <!-- Logo (シ) icon only — always visible on all screens -->
                <div style=${{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, cursor: 'pointer', zIndex: 10 }} className="group" onClick=${handleLogoClick}>
                    <div className="bg-gradient-to-br from-rose-400 to-indigo-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] group-hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] transition-all duration-500" style=${{ width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '24px', flexShrink: 0 }}>L</div>
                    <!-- Platform name: hidden on mobile (shown in center), visible on desktop -->
                    <span className="hidden sm:inline font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400" style=${{ fontSize: '1.35rem', whiteSpace: 'nowrap', fontWeight: '900', letterSpacing: '0.05em' }}>
                        ${lang === 'ar' ? 'لومينوفا التعليمية' : 'Luminova Edu'}
                    </span>
                </div>

                <!-- Center: Platform name on MOBILE only (fills the empty space) -->
                <!-- On desktop this is replaced by the nav links -->
                ${view !== 'quiz' ? html`
                    <!-- Desktop nav links (hidden on mobile) -->
                    <div key="dt-nav" className="lmv-top-nav-links hidden md:flex items-center gap-2 mx-auto">
                        <button onClick=${() => changeView('home')} title=${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}
                            className=${`px-5 py-2.5 rounded-2xl transition-all duration-500 flex gap-2 items-center font-black text-base flex-shrink-0 ${view === 'home' ? 'text-rose-400 bg-rose-500/20 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                            <${Luminova.Icons.Home} />
                            <span>${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}</span>
                        </button>
                        <button onClick=${() => changeView('community')} title=${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}
                            className=${`px-5 py-2.5 rounded-2xl transition-all duration-500 flex gap-2 items-center font-black text-base flex-shrink-0 ${view === 'community' ? 'text-rose-400 bg-rose-500/20 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                            <${Luminova.Icons.User} />
                            <span>${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}</span>
                        </button>
                        <button onClick=${() => changeView('academics')} title=${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}
                            className=${`px-5 py-2.5 rounded-2xl transition-all duration-500 flex gap-2 items-center font-black text-base flex-shrink-0 ${view === 'academics' ? 'text-rose-400 bg-rose-500/20 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                            <${Luminova.Icons.Book} />
                            <span>${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}</span>
                        </button>
                    </div>
                    <!-- Mobile: Platform name in center (visible only on mobile) -->
                    <div key="mb-nav" className="flex md:hidden flex-1 justify-center">
                        <span style=${{ fontWeight: '900', fontSize: '1.1rem', whiteSpace: 'nowrap', color: '#09090b' }} className="dark:!text-white">
                            ${lang === 'ar' ? 'لومينوفا التعليمية' : 'Luminova Edu'}
                        </span>
                    </div>
                ` : html`<div key="empty-nav" className="flex-1"></div>`}

                <!-- Right controls -->
                <div style=${{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button onClick=${toggleLang}
                        className="font-black text-sm border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-zinc-900 hover:text-white hover:border-zinc-900 dark:hover:bg-white dark:hover:text-zinc-900 dark:hover:border-white transition-all shadow-sm flex-shrink-0">
                        ${lang === 'ar' ? 'EN' : 'AR'}
                    </button>
                    <button onClick=${toggleTheme}
                        className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-lg sm:text-xl shadow-inner flex-shrink-0" title="Toggle Theme">
                        ${data.settings?.theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </nav>
            `}

            <main className=${`container mx-auto px-4 pb-20 sm:pb-8 max-w-[1600px] ${view === 'fullscreenViewer' ? 'hidden' : ''}`}>
                ${renderView()}
            </main>

            <!-- Mobile Bottom Navigation Bar (hidden on desktop via CSS) -->
            ${view !== 'quiz' && html`
                <nav key="bottom-nav-container" className="lmv-bottom-nav" aria-label=${lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
                    <button className=${`lmv-bottom-nav-btn ${view === 'home' ? 'active' : ''}`} onClick=${() => changeView('home')} title=${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}>
                        <${Luminova.Icons.Home} />
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.home : Luminova.i18n.en.home}</span>
                    </button>
                    <button className=${`lmv-bottom-nav-btn ${view === 'academics' ? 'active' : ''}`} onClick=${() => changeView('academics')} title=${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}>
                        <${Luminova.Icons.Book} />
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.academic : Luminova.i18n.en.academic}</span>
                    </button>
                    <button className=${`lmv-bottom-nav-btn ${view === 'community' ? 'active' : ''}`} onClick=${() => changeView('community')} title=${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}>
                        <${Luminova.Icons.User} />
                        <span className="lmv-nav-label">${lang === 'ar' ? Luminova.i18n.ar.community : Luminova.i18n.en.community}</span>
                    </button>
                </nav>
            `}
        </div>
    `;
    };

    const root = window.ReactDOM.createRoot(document.getElementById('root'));
    root.render(html`<${App} />`);

})();

