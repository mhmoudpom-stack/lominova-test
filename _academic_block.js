Luminova.Pages.AcademicHierarchyPage = ({ data, lang, setView, setActiveQuiz, setActiveSummary }) => {
        const [selectedYear, setSelectedYear] = useState(null);
        const [selectedSem, setSelectedSem] = useState(null);
        const [selectedSub, setSelectedSub] = useState(null);
        const [activeTab, setActiveTab] = useState('summaries');
        const [activeAttachmentItem, setActiveAttachmentItem] = useState(null);

        const semesters = data.semesters.filter(s => s.yearId === selectedYear?.id);
        const subjects  = data.subjects.filter(s => s.semesterId === selectedSem?.id);
        const summaries = data.summaries.filter(s => s.subjectId === selectedSub?.id);
        const quizzes   = data.quizzes.filter(q => q.subjectId === selectedSub?.id);

        // ── LEVEL 3: Attachments Sub-View ──────────────────────────────────────
        if (activeAttachmentItem) {
            return html`<${Luminova.Components.SummaryCard}
                item=${activeAttachmentItem}
                data=${data}
                lang=${lang}
                onClose=${() => setActiveAttachmentItem(null)}
            />`;
        }

        // ── LEVEL 2: Subject Dashboard (Premium Tabs) ──────────────────────────
        if (selectedSub) {
            const subjectName = selectedSub[`name${lang === 'ar' ? 'Ar' : 'En'}`] || selectedSub.nameAr || selectedSub.nameEn;
            const semName = selectedSem ? (selectedSem[`name${lang === 'ar' ? 'Ar' : 'En'}`] || selectedSem.nameAr) : '';
            return html`
            <div className="animate-fade-in space-y-6">

                <!-- Breadcrumb / Back bar -->
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick=${() => setSelectedSub(null)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold bg-white/2 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/10 shadow-lg transition-all duration-300"
                    >
                        <span>${lang === 'ar' ? '→ رجوع للمواد' : '← Back to Subjects'}</span>
                    </button>
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-bold flex-wrap">
                        ${semName && html`<span className="opacity-60">${semName}</span>`}
                        ${semName && html`<span className="opacity-40 text-lg leading-none">›</span>`}
                        <span className="text-rose-400 font-black">${subjectName}</span>
                    </div>
                </div>

                <!-- Subject title -->
                <h2 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-fuchsia-500 pb-1" style="word-break:normal;overflow-wrap:anywhere">${subjectName}</h2>

                <!-- Premium pill tabs -->
                <div className="flex gap-2 p-1.5 bg-white/2 backdrop-blur-xl rounded-2xl w-fit border border-white/5">
                    <button onClick=${() => setActiveTab('summaries')}
                        className=${`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'summaries' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-transparent text-white/40 hover:bg-white/5'}`}>
                        ${Luminova.i18n[lang].summaries} <span className="ms-1 opacity-70 font-normal">(${summaries.length})</span>
                    </button>
                    <button onClick=${() => setActiveTab('quizzes')}
                        className=${`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'quizzes' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-transparent text-white/40 hover:bg-white/5'}`}>
                        ${Luminova.i18n[lang].quizzes} <span className="ms-1 opacity-70 font-normal">(${quizzes.length})</span>
                    </button>
                </div>

                <!-- Animated content area -->
                <div className="animate-fade-in">
                    ${activeTab === 'summaries' ? html`
                        <${Luminova.Components.TimelineFeed}
                            items=${summaries}
                            students=${data.students}
                            subjects=${data.subjects}
                            lang=${lang}
                            onQuizClick=${() => {}}
                            onSummaryClick=${(item) => setActiveAttachmentItem(item)}
                        />
                        ${summaries.length === 0 ? html`<div className="text-center py-20 opacity-50 border-2 border-dashed rounded-2xl dark:border-gray-700">${Luminova.i18n[lang].emptyState}</div>` : null}
                    ` : html`
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${quizzes.map(q => {
                                const pub = Luminova.getStudent(q.publisherId, data.students);
                                return html`
                                <${Luminova.Components.GlassCard} key=${q.id} className="border-t-2 border-t-rose-500/50 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 rounded-[2rem]">
                                    ${q.publisherId && html`
                                        <div className="flex items-center gap-3 mb-4 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800 w-fit">
                                            <${Luminova.Components.Avatar} name=${pub.nameAr || pub.name} image=${pub.image} isVIP=${pub.isVIP} isFounder=${pub.isFounder || q.publisherId === 's_founder_hardcoded'} isVerified=${pub.isVerified} size="w-8 h-8" />
                                            <div>
                                                <span className="text-xs opacity-50 block leading-tight font-bold">${lang === 'ar' ? 'نُشر بواسطة:' : 'Published by:'}</span>
                                                <span className="text-sm font-black">${lang === 'ar' ? (pub.nameAr || pub.name) : (pub.nameEn || pub.name)}</span>
                                            </div>
                                        </div>
                                    `}
                                    <h3 className="text-xl font-bold mb-3" style="word-break:normal;overflow-wrap:anywhere">${q[`title${lang === 'ar' ? 'Ar' : 'En'}`] || q.titleAr || q.titleEn || q.title || 'بدون عنوان'}</h3>
                                    <p className="text-sm opacity-70 mb-5 bg-rose-500/10 text-rose-400 inline-block px-3 py-1 rounded-full border border-rose-500/20">${(q.questions || []).length} ${Luminova.i18n[lang].questions}</p>
                                    <${Luminova.Components.Button} onClick=${() => { setActiveQuiz(q); setView('quiz'); }} className="w-full text-base py-3 bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30">
                                        ${Luminova.i18n[lang].startQuiz}
                                    </${Luminova.Components.Button}>
                                </${Luminova.Components.GlassCard}>`;
                            })}
                            ${quizzes.length === 0 ? html`<div className="col-span-2 text-center py-20 opacity-50 border-2 border-dashed rounded-2xl dark:border-gray-700">${Luminova.i18n[lang].emptyState}</div>` : null}
                        </div>
                    `}
                </div>
            </div>`;
        }

        // ── LEVEL 1: Catalog View ──────────────────────────────────────────────
        return html`
        <div className="animate-fade-in space-y-8">

            <!-- Filter bar: Years + Semesters -->
            <${Luminova.Components.GlassCard} className="p-6 rounded-[2rem] shadow-2xl space-y-6">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">${Luminova.i18n[lang].years}</p>
                    <div className="flex flex-wrap gap-3">
                        ${data.years.map(y => html`
                            <button key=${y.id}
                                onClick=${() => { setSelectedYear(y); setSelectedSem(null); setSelectedSub(null); }}
                                className=${`px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-300 ${selectedYear?.id === y.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >${y[`name${lang === 'ar' ? 'Ar' : 'En'}`] || y.nameAr}</button>
                        `)}
                    </div>
                </div>
                ${selectedYear && semesters.length > 0 && html`
                    <div className="animate-fade-in border-t border-white/5 pt-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">${Luminova.i18n[lang].semesters}</p>
                        <div className="flex flex-wrap gap-3">
                            ${semesters.map(s => html`
                                <button key=${s.id}
                                    onClick=${() => { setSelectedSem(s); setSelectedSub(null); }}
                                    className=${`px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-300 ${selectedSem?.id === s.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >${s[`name${lang === 'ar' ? 'Ar' : 'En'}`] || s.nameAr}</button>
                            `)}
                        </div>
                    </div>
                `}
            </${Luminova.Components.GlassCard}>

            <!-- Subject cards grid -->
            ${selectedSem ? html`
                <div className="animate-fade-in">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">
                        ${Luminova.i18n[lang].subjects} <span className="opacity-50">(${subjects.length})</span>
                    </p>
                    ${subjects.length > 0 ? html`
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            ${subjects.map(sub => {
                                const subSummaries = data.summaries.filter(s => s.subjectId === sub.id);
                                const subQuizzes   = data.quizzes.filter(q => q.subjectId === sub.id);
                                const subName = sub[`name${lang === 'ar' ? 'Ar' : 'En'}`] || sub.nameAr;
                                return html`
                                <button key=${sub.id}
                                    onClick=${() => { setSelectedSub(sub); setActiveTab('summaries'); }}
                                    className="glass-card rounded-[2.5rem] p-8 text-start flex flex-col gap-5 shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-white/10 hover:border-rose-500/40 group w-full"
                                >
                                    <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-rose-400 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 text-white shrink-0">
                                        <${Luminova.Icons.Book} />
                                    </div>
                                    <h3 className="font-black text-base text-white leading-snug flex-1" style="word-break:normal;overflow-wrap:anywhere">
                                        ${subName}
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full border border-rose-500/20">
                                            ${subSummaries.length} ${lang === 'ar' ? 'تلخيص' : 'Summaries'}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                                            ${subQuizzes.length} ${lang === 'ar' ? 'اختبار' : 'Quizzes'}
                                        </span>
                                    </div>
                                </button>`;
                            })}
                        </div>
                    ` : html`
                        <div className="flex flex-col items-center justify-center py-24 opacity-50 border-2 border-dashed border-zinc-800 rounded-3xl">
                            <${Luminova.Icons.Book} />
                            <p className="mt-4 text-lg font-bold">${lang === 'ar' ? 'لا توجد مواد في هذا الترم' : 'No subjects in this semester'}</p>
                        </div>
                    `}
                </div>
            ` : html`
                <div className="flex flex-col items-center justify-center min-h-[45vh] opacity-40 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                    <${Luminova.Icons.Book} />
                    <p className="mt-4 text-xl font-bold text-center px-6">${lang === 'ar' ? 'اختر فرقة وترم لعرض المواد الدراسية' : 'Select a Year & Semester to browse subjects'}</p>
                </div>
            `}
        </div>
        `;
    };
