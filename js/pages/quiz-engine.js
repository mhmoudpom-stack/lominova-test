(function () {
    "use strict";

    if (!window.__LUMINOVA) return;
    const { useState, useEffect, useMemo, useCallback, useRef } = window.React;
    const html = window.htm.bind(window.React.createElement);
    const Luminova = window.__LUMINOVA;

    Luminova.Pages.QuizEngine = ({ quiz, data, lang, goBack }) => {
        // ── GUARDRAIL: Redirect to gateway if critical data is missing ──
        if (!quiz || !data) {
            return html`
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-10 text-center animate-fade-in border border-white/10">
                    <div className="text-7xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-black text-white mb-4">
                        ${lang === 'ar' ? 'خطأ في تحميل الامتحان' : 'Exam Load Error'}
                    </h2>
                    <p className="text-base font-bold text-fuchsia-100/60 mb-8 leading-relaxed">
                        ${lang === 'ar' ? 'لم يتم العثور على بيانات الامتحان أو بيانات المنصة. يرجى العودة والمحاولة مرة أخرى.' : 'Exam data or platform data is missing. Please go back and try again.'}
                    </p>
                    <button onClick=${goBack}
                        className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                        ${lang === 'ar' ? '🔙 العودة' : '🔙 Go Back'}
                    </button>
                </div>
            </div>
            `;
        }

        // ── SAFE DATA ACCESSOR ──
        const safeStudents = data?.students || [];

        const questions = useMemo(() => {
            if (!quiz || !quiz.questions) return [];
            let arr = [...quiz.questions];
            if (quiz.isShuffled) {
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
            }
            return arr;
        }, [quiz]);

        const maxScore = questions.reduce((sum, curr) => sum + (Number(curr.score) || 0), 0);

        const isEvaluation = quiz?.examMode === 'evaluation';
        const [isStarted, setIsStarted] = useState(!isEvaluation);
        const [studentInfo, setStudentInfo] = useState({ name: '', seatNumber: '', department: '', email: '' });
        const [now, setNow] = useState(new Date());
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [showDrawer, setShowDrawer] = useState(false);

        const [currentIndex, setCurrentIndex] = useState(0);
        const [answers, setAnswers] = useState({});
        const [isFinished, setIsFinished] = useState(false);
        const [isFeedbackRevealed, setIsFeedbackRevealed] = useState(false);
        const [revealedQuestions, setRevealedQuestions] = useState(new Set());
        const [cheatWarnings, setCheatWarnings] = useState(0);
        const [isLateSubmission, setIsLateSubmission] = useState(false);
        const [isVerifying, setIsVerifying] = useState(false);
        const [gatewayError, setGatewayError] = useState(null);
        const [debugError, setDebugError] = useState(null);
        const [terminationReason, setTerminationReason] = useState('completed');
        const [modalType, setModalType] = useState(null);
        const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
        const immunityRef = useRef(false);
        const loginTimeRef = useRef(null);

        useEffect(() => {
            if (isEvaluation && (!isStarted || !isFinished)) {
                const timer = setInterval(() => setNow(new Date()), 1000);
                return () => clearInterval(timer);
            }
        }, [isEvaluation, isStarted, isFinished]);

        useEffect(() => {
            if (isStarted && !isFinished) {
                const saved = localStorage.getItem('quiz_progress_' + quiz.id);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (parsed.answers) setAnswers(parsed.answers);
                        if (parsed.studentInfo) setStudentInfo(parsed.studentInfo);
                    } catch (e) { }
                }
            }
        }, [isStarted, isFinished, quiz.id]);

        useEffect(() => {
            if (isStarted && !isFinished) {
                localStorage.setItem('quiz_progress_' + quiz.id, JSON.stringify({ answers, studentInfo }));
            }
        }, [answers, studentInfo, isStarted, isFinished, quiz.id]);

        // Task 3: Auto-fullscreen for ALL exam types on start
        useEffect(() => {
            if (isStarted && !isFinished && questions.length > 0) {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen denied:', err));
                }
            }
        }, [isStarted, questions.length]);

        // Task 3: Helper — safe exit fullscreen
        const safeExitFullscreen = () => {
            try {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.log('Exit fullscreen error:', err));
                }
            } catch (e) { /* ignore */ }
        };

        const submitExam = async (reason = 'completed') => {
            if (hasAttemptedSubmit && reason === 'time_expired') return;
            immunityRef.current = true;
            setIsSubmitting(true);
            setHasAttemptedSubmit(true);
            setModalType(null);
            setTerminationReason(reason);

            if (quiz.endTime && new Date() > new Date(quiz.endTime)) {
                setIsLateSubmission(true);
            }

            let score = 0;
            questions.forEach(que => {
                if (que.type === 'mcq') {
                    if (answers[que.id] === que.correctAnswers?.[0]) score += Number(que.score);
                } else if (que.type === 'multi_select') {
                    const correctStr = [...(que.correctAnswers || [])].sort().join(',');
                    const ansStr = [...(answers[que.id] || [])].sort().join(',');
                    if (correctStr === ansStr) score += Number(que.score);
                }
                // Essay questions: score = 0 for auto-grading (manual grading by professor)
            });

            if (isEvaluation) {
                // ── IRON-CLAD SANITIZER ──────────────────────────────
                // Aggressively strips DOM nodes, React fibers, events,
                // and any non-primitive object to guarantee clean JSON.
                const sanitizeValue = (val) => {
                    if (val === null || val === undefined) return null;
                    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
                    if (Array.isArray(val)) return val.map(v => sanitizeValue(v));
                    // If it's ANY object (DOM node, Event, React fiber, etc.) — kill it
                    return 'Invalid Format';
                };

                // ── HUMAN-READABLE ANSWER RESOLVER ──────────────────
                const resolveAnswerText = (que) => {
                    const raw = answers[que.id];
                    if (raw === null || raw === undefined) return 'لم يتم الإجابة';
                    const opts = que.options || que.optionsAr || [];
                    if (que.type === 'mcq') {
                        return typeof raw === 'number' && opts[raw] ? String(opts[raw]) : sanitizeValue(raw);
                    }
                    if (que.type === 'multi_select') {
                        if (Array.isArray(raw)) return raw.map(idx => opts[idx] ? String(opts[idx]) : String(idx)).join(' | ');
                        return sanitizeValue(raw);
                    }
                    // essay or other
                    return sanitizeValue(raw);
                };

                // ── BINARY SCORE (1/0) ───────────────────────────────
                const resolveQuestionScore = (que) => {
                    if (que.type === 'essay') return 0; // Manual grading
                    if (que.type === 'mcq') return answers[que.id] === que.correctAnswers?.[0] ? 1 : 0;
                    if (que.type === 'multi_select') {
                        const correctStr = [...(que.correctAnswers || [])].sort().join(',');
                        const ansStr = [...(answers[que.id] || [])].sort().join(',');
                        return correctStr === ansStr ? 1 : 0;
                    }
                    return 0;
                };

                const payload = {
                    studentName: studentInfo.name || studentInfo.nameAr || "غير مسجل",
                    seatNumber: studentInfo.seatNumber || studentInfo.seat || "غير مسجل",
                    department: String(studentInfo.department || ''),
                    email: String(studentInfo.email || ''),
                    examTitle: String(quiz.titleEn || quiz.titleAr || quiz.title || ''),
                    score,
                    maxScore,
                    timeTaken: 'N/A',
                    loginTime: loginTimeRef.current || new Date().toISOString(),
                    submitTime: new Date().toISOString(),
                    terminationReason: String(reason),
                    adminEmails: String(quiz.adminEmails || ''),
                    settings: {
                        sendToStudent: Boolean(quiz.settings && quiz.settings.showResultEmail) && !isEvaluation
                    },
                    responses: questions.map(que => ({
                        question: String(que.text || que.textAr || ''),
                        studentAnswer: resolveAnswerText(que),
                        questionScore: resolveQuestionScore(que),
                        isCorrect: que.type === 'essay' ? null : (resolveQuestionScore(que) === 1)
                    }))
                };

                try {
                    const url = quiz.webhookUrl || '';
                    const response = await Luminova.Services.GAS.submitExam(url, payload);
                    
                    if (response && response.status === 'ok') {
                        safeExitFullscreen();
                        
                        setIsSubmitting(false);
                        setIsFinished(true);
                        if (reason === 'completed') {
                            setModalType('success');
                        } else {
                            setModalType('force_submitted');
                        }
                        setDebugError(null);
                        localStorage.removeItem('quiz_progress_' + quiz.id);
                    } else {
                        throw new Error('Backend validation failed');
                    }
                } catch (e) {
                    console.error('Submission failed:', e);
                    setDebugError(e.message || 'Unknown Error');
                    setIsSubmitting(false);
                    setModalType('submission_failed');
                    return; // Prevent exam from finishing so user can retry
                }
            } else {
                safeExitFullscreen();
                setIsFinished(true);
                localStorage.removeItem('quiz_progress_' + quiz.id);
            }
        };

        useEffect(() => {
            if (isStarted && !isFinished && isEvaluation && quiz.endTime) {
                if (now >= new Date(quiz.endTime)) {
                    submitExam('time_expired');
                }
            }
        }, [now, isStarted, isFinished, isEvaluation, submitExam, quiz?.endTime]);

        useEffect(() => {
            if (isStarted && !isFinished && isEvaluation && !hasAttemptedSubmit) {
                const cheatGuard = () => {
                    if (immunityRef.current || isSubmitting) return;
                    if (!isStarted || hasAttemptedSubmit) return;
                    if (cheatWarnings === 0) {
                        setCheatWarnings(1);
                        setModalType('cheat_warning');
                    } else {
                        submitExam('anti_cheat_violation');
                    }
                };

                // Tab switch / app switch
                const handleVisibility = () => {
                    if (immunityRef.current || !isStarted) return;
                    if (document.hidden) cheatGuard();
                };

                // Window blur (fallback for visibility)
                const handleBlur = () => {
                    if (immunityRef.current || !isStarted) return;
                    cheatGuard();
                };

                // Fullscreen exit detection
                const handleFullscreenChange = () => {
                    if (immunityRef.current || !isStarted) return;
                    if (!document.fullscreenElement && isStarted && !isFinished) {
                        cheatGuard();
                    }
                };

                const handleBeforeUnload = (e) => {
                    e.preventDefault();
                    e.returnValue = '';
                };

                document.addEventListener('visibilitychange', handleVisibility);
                window.addEventListener('blur', handleBlur);
                document.addEventListener('fullscreenchange', handleFullscreenChange);
                window.addEventListener('beforeunload', handleBeforeUnload);

                return () => {
                    document.removeEventListener('visibilitychange', handleVisibility);
                    window.removeEventListener('blur', handleBlur);
                    document.removeEventListener('fullscreenchange', handleFullscreenChange);
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                };
            }
        }, [isStarted, isFinished, isEvaluation, isSubmitting, hasAttemptedSubmit, cheatWarnings, submitExam, quiz?.autoSubmitOnCheat]);

        if (!isStarted) {
            // ── EXAM RULES MODAL (Post-Verification, Pre-Start) ──────
            if (modalType === 'exam_rules') {
                const startExamNow = () => {
                    // Force fullscreen for proctored environment
                    // Force fullscreen for proctored environment (already handled by useEffect, but ensure)
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen denied:', err));
                    }
                    loginTimeRef.current = new Date().toISOString();
                    setModalType(null);
                    setIsStarted(true);
                };

                return html`
                    <div className="absolute inset-0 bg-[#0A0514]"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 max-w-lg w-full bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-10 animate-fade-in border border-white/10">
                        <div className="text-center mb-8">
                            <div className="text-7xl mb-4">📋</div>
                            <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                                ${lang === 'ar' ? 'تعليمات الامتحان' : 'Exam Instructions'}
                            </h2>
                            <p className="text-sm font-bold text-fuchsia-100/40">
                                ${lang === 'ar' ? 'يرجى قراءة التعليمات بعناية قبل البدء' : 'Please read the instructions carefully before starting'}
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 dark:bg-gray-800/40 border border-white/10">
                                <span className="text-2xl mt-0.5">⏱️</span>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                    ${lang === 'ar'
                                    ? quiz.endTime
                                        ? 'الامتحان محدد بوقت. سيتم تسليم إجاباتك تلقائياً عند انتهاء الوقت.'
                                        : 'لا يوجد حد زمني لهذا الامتحان.'
                                    : quiz.endTime
                                        ? 'This exam is timed. Your answers will be auto-submitted when time runs out.'
                                        : 'There is no time limit for this exam.'}
                                </p>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 dark:bg-red-900/20 border border-red-500/20">
                                <span className="text-2xl mt-0.5">🚫</span>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                    ${lang === 'ar'
                                    ? 'نظام مراقبة إلكتروني مفعّل. مغادرة شاشة الامتحان (تبديل التطبيقات أو النوافذ) ستمنحك إنذاراً واحداً فقط. عند التكرار، سيتم سحب الامتحان وتسليمه تلقائياً.'
                                    : 'Electronic proctoring is active. Switching tabs or apps will give you ONE warning only. A second violation will auto-submit and terminate your exam.'}
                                </p>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 dark:bg-gray-800/40 border border-white/10">
                                <span className="text-2xl mt-0.5">📝</span>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                    ${lang === 'ar'
                                    ? 'لا يمكنك إعادة الامتحان بعد التسليم. تأكد من مراجعة إجاباتك قبل الضغط على زر الإنهاء.'
                                    : 'You cannot retake the exam after submission. Make sure to review your answers before finishing.'}
                                </p>
                            </div>
                        </div>

                        <button onClick=${startExamNow}
                            className="w-full py-4 rounded-2xl font-black text-xl text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                            ${lang === 'ar' ? '🚀 ابدأ الامتحان الآن' : '🚀 Start Exam Now'}
                        </button>
                    </div>
                </div>
                `;
            }

            const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentInfo.email);
            const isFormValid = studentInfo.name && studentInfo.seatNumber && studentInfo.department && isEmailValid;
            const verifyAndStart = async () => {
                if (!quiz.webhookUrl || !quiz.webhookUrl.includes('/macros/s/') || !quiz.webhookUrl.endsWith('/exec')) {
                    setDebugError("INVALID WEBHOOK URL: The URL must be a Web App URL ending in '/exec', not a library or script ID URL.");
                    setModalType('network_error');
                    return;
                }
                setIsVerifying(true);
                setGatewayError(null);
                setDebugError(null);
                try {
                    const examTitle = quiz.titleEn || quiz.titleAr || quiz.title;
                    const response = await Luminova.Services.GAS.verifyStudent(quiz.webhookUrl, {
                        exam: examTitle,
                        name: studentInfo.name,
                        email: studentInfo.email,
                        seat: studentInfo.seatNumber
                    });

                    if (response && response.status === 'clear') {
                        setModalType('exam_rules');
                    } else if (response && response.status === 'exists') {
                        setModalType('already_submitted');
                    } else {
                        throw new Error('Invalid response from server');
                    }
                } catch (error) {
                    console.error('Verification failed:', error);
                    setDebugError(error.message || 'Unknown Error');
                    setModalType('network_error');
                } finally {
                    setIsVerifying(false);
                }
            };

            let timeStatus = 'open';
            let timeMsg = '';

            if (quiz.startTime && now < new Date(quiz.startTime)) {
                timeStatus = 'early';
                const diff = new Date(quiz.startTime) - now;
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                timeMsg = lang === 'ar' ? `يبدأ الاختبار بعد ${m} دقيقة و ${s} ثانية` : `Starts in ${m}m ${s}s`;
            } else if (quiz.endTime && now > new Date(quiz.endTime)) {
                timeStatus = 'late';
                timeMsg = lang === 'ar' ? 'عذراً، لقد انتهى موعد الاختبار' : 'Sorry, the exam has ended';
            }

            return html`
            <div className="min-h-screen flex items-center justify-center bg-[#0A0514] p-4 relative overflow-hidden">
                <button onClick=${goBack} className="absolute top-6 left-6 sm:left-10 z-50 bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] text-white px-6 py-3 rounded-2xl font-black shadow-lg transition-all flex items-center gap-2 border border-white/10 hover:scale-105">
                    <span className="text-xl">🔙</span> ${lang === 'ar' ? 'الخروج' : 'Back'}
                </button>
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative z-10 max-w-lg w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🎓</div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2">${quiz.titleAr || quiz.title || quiz.titleEn}</h2>
                        <p className="text-fuchsia-100/60 font-bold opacity-80">${lang === 'ar' ? 'بوابة الدخول للاختبار التقييمي' : 'Evaluation Exam Gateway'}</p>
                    </div>

                    ${timeStatus === 'early' ? html`
                        <div className="text-center p-6 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 mb-6">
                            <div className="text-4xl font-black text-cyan-400 mb-2 tabular-nums">${timeMsg}</div>
                            <p className="text-sm opacity-70 font-bold">يرجى الانتظار، سيتم التفعيل تلقائياً</p>
                        </div>
                    ` : timeStatus === 'late' ? html`
                        <div className="text-center p-6 bg-red-500/10 rounded-2xl border border-red-500/30 mb-6">
                            <div className="text-2xl font-black text-red-500 mb-2">🚫 ${timeMsg}</div>
                        </div>
                        <div className="text-center">
                            <${Luminova.Components.Button} onClick=${goBack}>${lang === 'ar' ? 'العودة' : 'Go Back'}</${Luminova.Components.Button}>
                        </div>
                    ` : gatewayError === 'exists' ? html`
                        <div className="text-center p-10 rounded-3xl mb-6 animate-fade-in relative overflow-hidden" style=${{ background: 'rgba(127,29,29,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '2px solid rgba(239,68,68,0.25)', boxShadow: '0 8px 32px rgba(239,68,68,0.15), inset 0 0 80px rgba(239,68,68,0.03)' }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="text-8xl mb-6 animate-pulse" style=${{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.4))' }}>🔒</div>
                                <h2 className="text-3xl font-black mb-3" style=${{ background: 'linear-gradient(135deg, #ef4444, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    ${lang === 'ar' ? 'عفواً، لا يمكنك الدخول' : 'Sorry, You Cannot Enter'}
                                </h2>
                                <p className="text-base font-bold text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-sm mx-auto">
                                    ${lang === 'ar'
                                ? 'بياناتك (الاسم، أو رقم الجلوس، أو البريد الإلكتروني) مسجلة مسبقاً في هذا الامتحان. لقد قمت بالتسجيل من قبل.'
                                : 'Your information (name, seat number, or email) is already registered for this exam. You have already submitted.'}
                                </p>
                                <div className="space-y-3">
                                    <button onClick=${() => { setGatewayError(null); setDebugError(null); }}
                                        className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl transition-all hover:scale-[1.02]" 
                                        style=${{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 10px 30px -10px rgba(245,158,11,0.6)' }}>
                                        ${lang === 'ar' ? '🔄 رجوع وتعديل البيانات' : '🔄 Back to Edit Info'}
                                    </button>
                                    <button onClick=${goBack}
                                        className="w-full py-3.5 rounded-2xl font-black text-base bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all">
                                        ${lang === 'ar' ? 'العودة لصفحة المواد' : 'Return to Subjects'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : gatewayError === 'network_error' ? html`
                        <div className="text-center p-8 bg-orange-900/10 rounded-3xl border border-orange-500/30 mb-6 animate-fade-in">
                            <div className="text-7xl mb-6">📡</div>
                            <h2 className="text-2xl font-black text-orange-600 dark:text-orange-500 mb-4">
                                ${lang === 'ar' ? 'فشل الاتصال بالخادم' : 'Connection Error'}
                            </h2>
                            <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                ${lang === 'ar' ? 'حدثت مشكلة في الاتصال أثناء التحقق من بياناتك. يرجى التأكد من الإنترنت والمحاولة مرة أخرى.' : 'There was a connection issue verifying your data. Please check your internet and try again.'}
                            </p>
                            ${debugError && html`<div className="p-3 mb-6 bg-red-100 text-red-800 rounded-xl text-xs font-mono text-left break-words border border-red-300">${debugError}</div>`}
                            <${Luminova.Components.Button} onClick=${() => { setGatewayError(null); setDebugError(null); }} className="w-full py-4 rounded-2xl font-black bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/30 transition-all text-lg mb-3">
                                ${lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                            </${Luminova.Components.Button}>
                            <${Luminova.Components.Button} variant="secondary" onClick=${goBack} className="w-full py-4 rounded-2xl font-black transition-all text-lg">
                                ${lang === 'ar' ? 'العودة لصفحة المواد' : 'Return to Subjects'}
                            </${Luminova.Components.Button}>
                        </div>
                    ` : html`
                        <div className="space-y-4">
                            <${Luminova.Components.Input} label=${lang === 'ar' ? 'الاسم الرباعي' : 'Full Name'} val=${studentInfo.name} onChange=${v => setStudentInfo({ ...studentInfo, name: v })} />
                            <${Luminova.Components.Input} label=${lang === 'ar' ? 'رقم الجلوس' : 'Seat Number'} val=${studentInfo.seatNumber} onChange=${v => setStudentInfo({ ...studentInfo, seatNumber: v })} />
                            <${Luminova.Components.Input} label=${lang === 'ar' ? 'الشعبة / القسم' : 'Department'} val=${studentInfo.department} onChange=${v => setStudentInfo({ ...studentInfo, department: v })} />
                            <${Luminova.Components.Input} label=${lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} val=${studentInfo.email} onChange=${v => setStudentInfo({ ...studentInfo, email: v })} />
                            
                            <button 
                                disabled=${!isFormValid || isVerifying}
                                onClick=${verifyAndStart}
                                className="w-full py-4 mt-6 rounded-2xl font-black text-xl text-white bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-lg transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]">
                                ${isVerifying ? (lang === 'ar' ? '⏳ جاري التحقق من السجلات...' : '⏳ Verifying records...') : (lang === 'ar' ? 'بدء الاختبار' : 'Start Exam')}
                            </button>
                        </div>
                    `}
                </div>
            </div>
            `;
        }

        const q = questions[currentIndex];

        const handleFinish = () => {
            setModalType('submit');
        };

        if (isFinished) {
            const successModal = modalType === 'success' ? html`
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style=${{ background: 'rgba(10,5,20,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
                    <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/10 animate-fade-in text-center">
                        <div className="text-7xl mb-6">✅</div>
                        <h2 className="text-3xl font-black text-white mb-4">
                            ${lang === 'ar' ? 'نجاح التسليم' : 'Success'}
                        </h2>
                        <p className="text-lg font-bold text-fuchsia-100/60 mb-8 leading-relaxed">
                            ${lang === 'ar' ? 'تم تسليم امتحانك بنجاح بطريقة طبيعية، وتم تسجيل نتيجتك وحالة التسليم في النظام.' : 'Exam submitted normally and status recorded.'}
                        </p>
                        <button onClick=${() => setModalType(null)} className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-500 text-white shadow-xl transition-all text-xl">
                            ${lang === 'ar' ? 'متابعة' : 'Continue'}
                        </button>
                    </div>
                </div>
            ` : '';

            if (isEvaluation && String(quiz.showResultsAfter) !== 'true') {
                return html`
                ${successModal}
                <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 max-w-md w-full bg-white/2 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-10 border border-white/10 animate-fade-in text-center">
                        ${isLateSubmission && html`
                            <div className="mb-6 px-4 py-2 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 rounded-xl font-bold text-sm">
                                ⚠️ ${lang === 'ar' ? 'تم التسليم بنجاح، ولكن تم تسجيل تأخيرك عن الموعد المحدد.' : 'Successfully submitted, but marked as late.'}
                            </div>
                        `}
                        <div className="text-7xl mb-6 ${terminationReason === 'completed' ? 'animate-bounce' : ''}">
                            ${terminationReason === 'completed' ? '✅' : '⛔'}
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">
                            ${terminationReason === 'completed'
                        ? (lang === 'ar' ? 'تم تسليم امتحانك بنجاح!' : 'Your exam has been submitted successfully!')
                        : terminationReason === 'time_expired'
                            ? (lang === 'ar' ? 'انتهى الوقت!' : 'Time Expired!')
                            : (lang === 'ar' ? 'تم سحب الامتحان' : 'Exam Terminated')}
                        </h2>
                        <p className="text-lg font-bold text-fuchsia-100/60 mb-10 leading-relaxed">
                            ${terminationReason === 'completed'
                        ? (lang === 'ar' ? 'شكراً لك، تم حفظ جميع إجاباتك.' : 'Thank you, all your answers have been saved.')
                        : terminationReason === 'time_expired'
                            ? (lang === 'ar' ? 'انتهى الوقت المسموح به، تم حفظ وتسليم إجاباتك تلقائياً.' : 'Time is up. Your answers have been automatically saved and submitted.')
                            : (lang === 'ar' ? 'تم سحب الامتحان وإرساله للإدارة نظراً لمخالفة قواعد المراقبة والخروج من الشاشة أكثر من مرة.' : 'Exam force-submitted and sent to administration due to repeated proctoring violations.')}
                        </p>
                        <${Luminova.Components.Button} onClick=${goBack} className="w-full py-4 text-xl rounded-2xl font-black bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-500 text-white shadow-xl transition-all hover:scale-[1.02]">
                            ${lang === 'ar' ? 'الخروج للمواد' : 'Return to Subjects'}
                        </${Luminova.Components.Button}>
                    </div>
                </div>
                `;
            }

            let score = 0;
            questions.forEach(que => {
                if (que.type === 'mcq') {
                    if (answers[que.id] === que.correctAnswers?.[0]) score += Number(que.score);
                } else if (que.type === 'multi_select') {
                    const correctStr = [...(que.correctAnswers || [])].sort().join(',');
                    const ansStr = [...(answers[que.id] || [])].sort().join(',');
                    if (correctStr === ansStr) score += Number(que.score);
                }
            });

            return html`
            ${successModal}
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
                ${terminationReason !== 'completed' && html`
                    <div className="text-center mt-6 px-6 py-4 bg-red-500/20 text-red-600 dark:text-red-500 border border-red-500/50 rounded-2xl font-bold text-lg max-w-xl mx-auto shadow-lg animate-pulse">
                        ⚠️ ${terminationReason === 'time_expired'
                        ? (lang === 'ar' ? 'انتهى الوقت المسموح به، تم حفظ وتسليم إجاباتك تلقائياً.' : 'Time is up. Your answers have been automatically saved and submitted.')
                        : (lang === 'ar' ? 'تم سحب الامتحان وإرساله للإدارة نظراً لمخالفة قواعد المراقبة والخروج من الشاشة أكثر من مرة.' : 'Exam force-submitted and sent to administration due to repeated proctoring violations.')}
                    </div>
                `}
                ${isLateSubmission && html`
                    <div className="text-center mt-6 px-6 py-4 bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-500/50 rounded-2xl font-bold text-lg max-w-xl mx-auto shadow-lg animate-pulse">
                        ⚠️ ${lang === 'ar' ? 'تم التسليم بنجاح، ولكن تم تسجيل تأخيرك عن الموعد المحدد.' : 'Successfully submitted, but marked as late.'}
                    </div>
                `}
                <${Luminova.Components.GlassCard} className="text-center py-16 bg-gradient-to-b from-rose-500/5 to-transparent border-t-8 border-t-rose-500 rounded-[3rem] shadow-2xl">
                    <h2 className="text-5xl font-black mb-6 uppercase tracking-wider text-white">${Luminova.i18n[lang].results}</h2>
                    <div className="text-8xl font-black text-rose-400 drop-shadow-2xl mb-8">${score} <span className="text-4xl opacity-30 text-white">/ ${maxScore}</span></div>
                    <${Luminova.Components.Button} onClick=${goBack} className="px-10 py-4 text-xl rounded-full shadow-2xl hover:scale-105 bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-500 text-white">${lang === 'ar' ? 'العودة لصفحة الاختبارات' : 'Return to Subjects'}</${Luminova.Components.Button}>
                </${Luminova.Components.GlassCard}>
                
                ${questions.map((que, idx) => {
                            let isCorrect = false;
                            if (que.type === 'mcq') isCorrect = answers[que.id] === que.correctAnswers?.[0];
                            if (que.type === 'multi_select') isCorrect = [...(que.correctAnswers || [])].sort().join(',') === [...(answers[que.id] || [])].sort().join(',');
                            const studentProv = safeStudents.find(s => s.id === que?.studentId) || (que?.studentId === 's_founder' || que?.studentId === Luminova.FOUNDER.id ? Luminova.FOUNDER : null);

                            return html`
                        <${Luminova.Components.GlassCard} key=${que?.id || `result-q-${idx}`} className=${`border-r-4 ${que.type !== 'essay' ? (isCorrect ? 'border-r-green-500' : 'border-r-red-500') : 'border-r-rose-500'} relative`}>
                            <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl bg-black/10 dark:bg-white/10 font-bold text-sm">
                                ${que.score} ${Luminova.i18n[lang].score}
                            </div>
                            
                            ${studentProv && html`
                                <div className="flex flex-row justify-between items-center bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 mb-4 w-full">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-xs text-slate-400">المساهم بالمعلومة:</span>
                                        <span className="text-sm font-bold text-yellow-500">${lang === 'ar' ? studentProv.nameAr || studentProv.name : studentProv.nameEn || studentProv.name}</span>
                                    </div>
                                    <${Luminova.Components.Avatar} name=${studentProv.nameAr || studentProv.name} image=${studentProv.image} size="w-12 h-12 rounded-full border-2 border-slate-600 shadow-sm shrink-0" />
                                </div>
                            `}

                            <h4 className="font-bold text-xl mt-4 mb-4 leading-relaxed">س ${idx + 1}: ${que.text || que.textAr}</h4>
                            
                            ${que.type !== 'essay' && html`
                                <div className="mt-6 p-5 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 shadow-inner">
                                    <p className="flex items-start gap-2 mb-2" dangerouslySetInnerHTML=${{ __html: `<span class='font-bold opacity-70 min-w-[120px]'>${Luminova.i18n[lang].correct}:</span> <strong class="text-green-600 dark:text-green-400 font-bold text-lg">${(que.type === 'mcq' ? (que.options || que.optionsAr)[que.correctAnswers[0]] : que.correctAnswers.map(c => (que.options || que.optionsAr)[c]).join(' <span class="text-gray-400">|</span> '))}</strong>` }} />
                                    ${!isCorrect && html`<p className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2" dangerouslySetInnerHTML=${{ __html: `<span class='font-bold opacity-70 min-w-[120px]'>${Luminova.i18n[lang].wrong}:</span> <strong class="text-red-500 dark:text-red-400 font-bold line-through opacity-80">${(answers[que.id] !== undefined ? (que.type === 'mcq' ? (que.options || que.optionsAr)[answers[que.id]] : (answers[que.id].length ? answers[que.id].map(c => (que.options || que.optionsAr)[c]).join(' | ') : 'بدون إجابة')) : 'بدون إجابة')}</strong>` }} />`}
                                </div>
                            `}

                            ${que.type === 'essay' && html`
                                <div className="mt-6 p-5 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 shadow-inner space-y-4">
                                    <div>
                                        <p className="font-black text-rose-400 mb-2">${Luminova.i18n[lang].modelAnswer}</p>
                                        <p className="text-md leading-relaxed p-4 bg-white/2 backdrop-blur-xl rounded border-l-4 border-l-rose-500 font-medium">${que.modelAnswer || que.modelAnswerAr}</p>
                                    </div>
                                    <div>
                                        <p className="font-bold border-t pt-4 dark:border-gray-700 mb-2">${lang === 'ar' ? 'إجابتك' : 'Your Answer'}:</p>
                                        <p className="text-md text-gray-600 dark:text-gray-400 p-4 bg-white/50 dark:bg-gray-900/50 rounded italic">${answers[que.id] || 'ـ بدون إجابة ـ'}</p>
                                    </div>
                                </div>
                            `}

                            ${(que.explanation || que.explanationAr) && html`
                                <div className="mt-6 p-5 rounded-xl bg-brand-DEFAULT/15 border border-brand-DEFAULT/30 relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 opacity-10 text-8xl text-brand-DEFAULT rotate-12">💡</div>
                                    <p className="font-black text-brand-DEFAULT mb-2 flex items-center gap-2">💡 ${Luminova.i18n[lang].explanation}</p>
                                    <p className="text-md leading-relaxed font-bold z-10 relative">${que.explanation || que.explanationAr}</p>
                                </div>
                            `}
                        </${Luminova.Components.GlassCard}>
                    `;
                        })}
            </div>
        `;
        }

        // ── UX FIX: Graceful Empty State (Coming Soon) ──
        if (!q) {
            return html`
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-indigo-500/10 pointer-events-none"></div>
                <div className="max-w-md w-full backdrop-blur-3xl bg-white/2 border border-white/10 rounded-[2.5rem] p-12 text-center animate-fade-in shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative z-10">
                    <div className="relative mb-8">
                        <div className="text-7xl animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">⏳</div>
                        <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-2xl animate-pulse -z-10"></div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
                        ${lang === 'ar' ? 'جاري تحضير الاختبار...' : 'Preparing Exam...'}
                    </h2>
                    
                    <p className="text-lg font-bold text-gray-400 mb-10 leading-relaxed">
                        ${lang === 'ar' ? 'يرجى العودة لاحقاً' : 'Please check back later'}
                    </p>
                    
                    <button onClick=${goBack}
                        className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 shadow-xl backdrop-blur-md">
                        ${lang === 'ar' ? '🔙 العودة للمكتبة' : '🔙 Back to Library'}
                    </button>
                </div>
            </div>
            `;
        }

        const currentQStudent = safeStudents.find(s => s.id === q?.studentId) || ((q?.studentId === 's_founder' || q?.studentId === Luminova.FOUNDER.id) ? Luminova.FOUNDER : {});

        return html`
        <div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col pt-10 pb-20">

            ${isSubmitting && html`
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style=${{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(18px)' }}>
                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 flex flex-col items-center">
                        <div className="animate-spin text-5xl mb-4 text-rose-400">⏳</div>
                        <h2 className="text-xl font-black text-white">${lang === 'ar' ? 'جاري تسليم وإرسال إجاباتك...' : 'Submitting your answers...'}</h2>
                    </div>
                </div>
            `}

            <!-- Exit Modal -->
            ${modalType === 'exit' && html`
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style=${{ background: 'rgba(127,29,29,0.25)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.35)] p-8 w-full max-w-sm border border-red-200/40 dark:border-red-900/40 animate-fade-in text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                            ${lang === 'ar' ? 'خروج من الامتحان' : 'Leave Exam'}
                        </h2>
                        <p className="text-base font-bold text-gray-500 dark:text-gray-400 mb-7 leading-relaxed">
                            ${isEvaluation
                    ? (lang === 'ar' ? 'تحذير: خروجك الآن سيعتبر تسليماً نهائياً للامتحان.' : 'Warning: Exiting now will count as a final submission.')
                    : (lang === 'ar' ? 'هل أنت متأكد من الخروج من الامتحان؟ الإجابات لن تُحفظ.' : 'Are you sure you want to leave? Your progress will be lost.')}
                        </p>
                        <div className="flex gap-3">
                            <button onClick=${() => setModalType(null)}
                                className="flex-1 py-3.5 rounded-2xl font-black bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 transition-all"
                            >${lang === 'ar' ? 'تراجع' : 'Stay'}</button>
                            <button onMouseDown=${() => { if (isEvaluation) { immunityRef.current = true; setIsSubmitting(true); } }} onClick=${() => {
                    if (isEvaluation) { submitExam(); } else { safeExitFullscreen(); setModalType(null); goBack(); }
                }}
                                className="flex-1 py-3.5 rounded-2xl font-black bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all"
                            >${isEvaluation ? (lang === 'ar' ? 'تسليم وخروج' : 'Submit & Exit') : (lang === 'ar' ? 'نعم، خروج' : 'Yes, Exit')}</button>
                        </div>
                    </div>
                </div>
            `}

            <!-- Submit Modal -->
            ${modalType === 'submit' && html`
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style=${{ background: 'rgba(6,78,59,0.2)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.35)] p-8 w-full max-w-sm border border-green-200/40 dark:border-green-900/40 animate-fade-in text-center">
                        <div className="text-5xl mb-4">📝</div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                            ${lang === 'ar' ? 'تسليم الامتحان' : 'Submit Exam'}
                        </h2>
                        <p className="text-base font-bold text-gray-500 dark:text-gray-400 mb-7 leading-relaxed">
                            ${lang === 'ar' ? 'هل أنت متأكد من إنهاء الامتحان وتسليم الإجابات؟' : 'Are you sure you want to finish and submit your answers?'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick=${() => setModalType(null)}
                                className="flex-1 py-3.5 rounded-2xl font-black bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 transition-all"
                            >${lang === 'ar' ? 'تراجع' : 'Cancel'}</button>
                            <button onMouseDown=${() => { immunityRef.current = true; setIsSubmitting(true); }} onClick=${() => submitExam('completed')}
                                className="flex-1 py-3.5 rounded-2xl font-black bg-gradient-to-r from-brand-DEFAULT to-green-500 text-white shadow-lg shadow-brand-DEFAULT/30 transition-all hover:opacity-90"
                            >${lang === 'ar' ? 'نعم، إنهاء وتسليم' : 'Yes, Submit'}</button>
                        </div>
                    </div>
                </div>
            `}

            <!-- Cheat Warning Modal -->
            ${modalType === 'cheat_warning' && html`
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style=${{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(24px)' }}
                >
                    <div className="bg-white/5 backdrop-blur-3xl rounded-3xl p-10 w-full max-w-md border border-rose-500/50 animate-fade-in text-center">
                        <div className="text-7xl mb-6 animate-pulse text-rose-500">🚫</div>
                        <h2 className="text-3xl font-black text-white mb-4">
                            ${lang === 'ar' ? 'إنذار: مخالفة قواعد المراقبة' : 'Warning: Proctored Rule Violation'}
                        </h2>
                        <p className="text-lg font-bold text-zinc-400 mb-8 leading-relaxed">
                            ${lang === 'ar'
                    ? 'لقد قمت بمغادرة شاشة الاختبار. تكرار هذا الإجراء سيؤدي إلى سحب ورقتك وتسليم الامتحان تلقائياً.'
                    : 'You left the exam screen. Repeating this action will force submit your exam automatically.'}
                        </p>
                        <button onClick=${() => setModalType(null)}
                            className="w-full py-4 rounded-2xl font-black bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/30 transition-all text-xl"
                        >${lang === 'ar' ? 'موافق / أوافق على الاستمرار' : 'Understood'}</button>
                    </div>
                </div>
            `}

            <!-- Network Error Modal -->
            ${modalType === 'network_error' && html`
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style=${{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
                    <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/10 animate-fade-in text-center">
                        <div className="text-7xl mb-6 text-rose-400 drop-shadow-lg">📡</div>
                        <h2 className="text-3xl font-black text-white mb-4">
                            ${lang === 'ar' ? 'خطأ في الاتصال' : 'Network Error'}
                        </h2>
                        <p className="text-zinc-400 font-bold mb-8 leading-relaxed">
                            ${lang === 'ar' 
                            ? 'عذراً، حدث خطأ أثناء الاتصال بالخادم. تأكد من جودة الإنترنت وحاول لاحقاً.' 
                            : 'Sorry, there was an error connecting to the server. Please check your internet and try again.'}
                        </p>
                        ${debugError && html`<div className="p-3 mb-6 bg-red-500/10 text-red-400 rounded-xl text-xs font-mono text-left break-words border border-red-500/20">${debugError}</div>`}
                        <button onClick=${() => setModalType(null)}
                            className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-500 hover:opacity-90 text-white shadow-xl transition-all text-xl"
                        >${lang === 'ar' ? 'إغلاق والمحاولة لاحقاً' : 'Close and Retry'}</button>
                    </div>
                </div>
            `}

            <!-- Already Submitted Modal (Gatekeeper) -->
            ${modalType === 'already_submitted' && html`
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style=${{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl rounded-3xl shadow-[0_32px_80px_rgba(250,204,21,0.2)] p-10 w-full max-w-md border border-brand-gold/50 animate-fade-in text-center">
                        <div className="text-7xl mb-6 text-brand-gold drop-shadow-lg">🛑</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                            ${lang === 'ar' ? 'عفواً، لا يمكنك الدخول' : 'Access Denied'}
                        </h2>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                            ${lang === 'ar'
                    ? 'لقد قمت بأداء هذا الاختبار مسبقاً.'
                    : 'You have already submitted this exam.'}
                        </p>
                        <button onClick=${() => setModalType(null)}
                            className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:opacity-90 text-white shadow-xl transition-all text-xl"
                        >${lang === 'ar' ? 'رجوع لتعديل البيانات' : 'Back to Edit Info'}</button>
                    </div>
                </div>
            `}

            <!-- Submit Error Modal (Final Submission) -->
            ${modalType === 'submit_error' && html`
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style=${{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl rounded-3xl shadow-[0_32px_80px_rgba(250,204,21,0.2)] p-10 w-full max-w-md border border-brand-gold/50 animate-fade-in text-center">
                        <div className="text-7xl mb-6 text-brand-gold drop-shadow-lg">⚠️</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                            ${lang === 'ar' ? 'فشل الإرسال' : 'Submission Failed'}
                        </h2>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                            ${lang === 'ar'
                    ? 'حدث خطأ أثناء إرسال إجاباتك. لا تقلق، إجاباتك محفوظة. يرجى المحاولة مرة أخرى.'
                    : 'An error occurred while sending your answers. Don\'t worry, your answers are saved. Please try again.'}
                        </p>
                        ${debugError && html`<div className="p-3 mb-6 bg-red-100 text-red-800 rounded-xl text-xs font-mono text-left break-words border border-red-300">${debugError}</div>`}
                        <button onMouseDown=${() => { immunityRef.current = true; setIsSubmitting(true); }} onClick=${() => submitExam(terminationReason)}
                            disabled=${isSubmitting}
                            className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-brand-DEFAULT to-brand-gold hover:opacity-90 text-white shadow-xl shadow-brand-gold/30 transition-all text-xl disabled:opacity-50"
                        >
                            ${isSubmitting ? (lang === 'ar' ? 'جاري إعادة الإرسال...' : 'Retrying...') : (lang === 'ar' ? 'إعادة إرسال النتيجة (Retry)' : 'Retry Submission')}
                        </button>
                    </div>
                </div>
            `}

            <!-- Force Submitted Modal -->
            ${modalType === 'force_submitted' && html`
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style=${{ background: 'rgba(127,29,29,0.5)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.5)] p-10 w-full max-w-md border-2 border-red-500/50 animate-fade-in text-center">
                        <div className="text-7xl mb-6 text-red-500">⛔</div>
                        <h2 className="text-3xl font-black text-red-600 dark:text-red-500 mb-4">
                            ${lang === 'ar' ? 'تعذر إكمال الاختبار' : 'Exam Terminated'}
                        </h2>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                            ${lang === 'ar'
                    ? 'تم إرسال امتحانك تلقائياً نظراً لخروجك أكثر من مرة من شاشة الامتحان.'
                    : 'Your exam has been forcibly submitted due to repeated screen leaving violations.'}
                        </p>
                        <button onClick=${goBack}
                            className="w-full py-4 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition-all text-xl"
                        >${lang === 'ar' ? 'العودة لصفحة الاختبارات' : 'Go Back'}</button>
                    </div>
                </div>
            `}

            ${showDrawer && html`
                <div className="fixed inset-0 z-[8000] flex animate-fade-in">
                    <div className="absolute inset-0 bg-[#0A0514]/60 backdrop-blur-sm" onClick=${() => setShowDrawer(false)}></div>
                    <div className="quiz-side-drawer fixed top-0 bottom-0 end-0 w-[300px] sm:w-[340px] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)]" style=${{ background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(40px)', borderInlineStart: '1px solid rgba(255,255,255,0.1)' }}>
                        <!-- Close button -->
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
                            <h3 className="font-black text-lg text-rose-400 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                                ${lang === 'ar' ? 'خريطة الأسئلة' : 'Questions Map'}
                            </h3>
                            <button onClick=${() => setShowDrawer(false)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-white/70 hover:text-red-400 transition-all text-base font-black">✕</button>
                        </div>
                        <!-- Progress summary -->
                        <div className="px-5 py-3 flex items-center justify-between text-xs font-bold text-white/50 border-b border-white/5">
                            <span>${lang === 'ar' ? 'تمت الإجابة' : 'Answered'}: <span className="text-green-400">${Object.keys(answers).filter(k => { const v = answers[k]; return v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0); }).length}</span> / ${questions.length}</span>
                            <span className="text-rose-400">${lang === 'ar' ? 'الحالي' : 'Current'}: ${currentIndex + 1}</span>
                        </div>
                        <!-- Question list -->
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <div className="flex flex-col gap-2">
                                ${questions.map((qItem, i) => {
                        const isAnswered = answers[qItem?.id] !== undefined && (Array.isArray(answers[qItem?.id]) ? answers[qItem?.id].length > 0 : answers[qItem?.id] !== '');
                        const isCurrent = currentIndex === i;
                        const isLocked = quiz.allowBackNavigation === false && i < currentIndex;
                        const qLabel = lang === 'ar' ? `السؤال ${(i + 1).toLocaleString('ar-EG')}` : `Question ${i + 1}`;
                        return html`
                                    <button key=${qItem?.id || `nav-q-${i}`} 
                                        onClick=${() => {
                                if (!isLocked) {
                                    setCurrentIndex(i);
                                    setShowDrawer(false);
                                    if (quiz.feedbackMode === 'immediate' && revealedQuestions.has(qItem?.id)) {
                                        setIsFeedbackRevealed(true);
                                    } else {
                                        setIsFeedbackRevealed(false);
                                    }
                                }
                            }}
                                        disabled=${isLocked}
                                        className=${`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-start transition-all duration-300 ${isCurrent ? 'bg-rose-500/20 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)] text-white' : isAnswered ? 'bg-white/5 hover:bg-white/10 border border-white/5 text-white/80' : 'bg-white/2 hover:bg-white/10 border border-transparent text-white/50'} ${isLocked ? 'opacity-30 cursor-not-allowed' : 'active:scale-[0.98]'}`}>
                                        <!-- Number circle -->
                                        <span className=${`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isCurrent ? 'bg-rose-500 text-white shadow-md' : isAnswered ? 'bg-indigo-500/80 text-white' : 'bg-white/10 text-white/40'}`}>${i + 1}</span>
                                        <!-- Label -->
                                        <span className="flex-1 font-bold text-sm truncate text-white">${qLabel}</span>
                                        <!-- Status indicator -->
                                        ${isAnswered && !isCurrent ? html`<span className="text-indigo-400 text-base shrink-0">✓</span>` : null}
                                        ${isCurrent ? html`<span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0"></span>` : null}
                                    </button>
                                `;
                    })}
                            </div>
                        </div>
                    </div>
                </div>
            `}

            ${(isEvaluation && isStarted && !isFinished && quiz.endTime) ? (() => {
                let diff = new Date(quiz.endTime) - now;
                if (diff < 0) diff = 0;
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                const isUrgent = diff < 300000;
                return html`
                    <div className=${`sticky top-4 z-50 mx-auto w-max px-6 py-3 rounded-full border shadow-2xl backdrop-blur-2xl mb-6 font-mono text-2xl font-black tracking-widest transition-all duration-300 ${isUrgent ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-white/[0.03] border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)]'}`}>
                        ⏳ ${h}:${m}:${s}
                    </div>
                `;
            })() : ''}

            <div className="flex justify-between items-center mb-10 bg-white/[0.03] backdrop-blur-2xl p-4 rounded-2xl shadow-lg border border-white/10">
                <${Luminova.Components.Button} variant="danger" onClick=${() => setModalType('exit')} className="rounded-full shadow-lg hover:-translate-x-1">
                    <${Luminova.Icons.XCircle} /> <span className="hidden sm:inline">${lang === 'ar' ? 'خروج' : 'Quit'}</span>
                </${Luminova.Components.Button}>
                <div className="flex-1 mx-4 sm:mx-8 relative">
                    <div className="bg-white/10 h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-rose-400 to-indigo-500 h-full transition-all duration-500 ease-out" style=${{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                    </div>
                </div>
                <span className="font-black text-xl sm:text-2xl text-rose-400 drop-shadow-sm shrink-0">${currentIndex + 1} <span className="opacity-40 text-lg">/ ${questions.length}</span></span>
                <!-- Drawer trigger button -->
                <button onClick=${() => setShowDrawer(true)} className="ms-3 w-10 h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 group" title=${lang === 'ar' ? 'خريطة الأسئلة' : 'Questions Map'}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400 group-hover:text-rose-300 transition-colors"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
            </div>

            <${Luminova.Components.GlassCard} className="relative overflow-visible mb-10 flex-1 flex flex-col shadow-2xl">
                ${currentQStudent.id && html`
                    <div className="absolute -top-12 sm:-top-6 start-1/2 -translate-x-1/2 sm:translate-x-0 sm:start-8 flex flex-col sm:flex-row items-center gap-1 sm:gap-3 bg-white/[0.03] backdrop-blur-2xl shadow-xl p-2 sm:p-2 sm:pl-4 rounded-xl sm:rounded-full border border-white/10 z-10 animate-fade-in group hover:scale-105 transition-transform max-w-[90vw] sm:max-w-none text-center sm:text-start mx-auto w-max mb-8 sm:mb-0">
                        <${Luminova.Components.Avatar} name=${currentQStudent.nameAr || currentQStudent.name} image=${currentQStudent.image} isVerified=${currentQStudent.isVerified} size="w-8 h-8 shrink-0" />
                        <span className="text-xs sm:text-sm font-black mx-1 text-rose-400 group-hover:text-fuchsia-400 break-words whitespace-normal transition-colors">${lang === 'ar' ? currentQStudent.nameAr || currentQStudent.name : currentQStudent.nameEn || currentQStudent.name}</span>
                        <span className="text-xs font-bold text-white/40 hidden sm:inline border-r pr-2 border-white/10 shrink-0">:المساهم بالسؤال</span>
                    </div>
                `}

                <div className="flex-1 mt-6">
                    <div className="flex justify-between items-start mb-8 ${q.mediaUrl ? '' : 'border-b border-white/10 pb-6'}">
                        <h3 className="text-3xl font-bold leading-relaxed w-[85%] text-white">${q.text || q.textAr}</h3>
                        <span className="text-xl font-black bg-rose-500/10 text-rose-400 px-4 py-2 rounded-xl border border-rose-500/30 shadow-sm shrink-0">${q.score} ${Luminova.i18n[lang].score}</span>
                    </div>
                    ${q.mediaUrl && html`
                        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6 w-full flex justify-center">
                            <div className="w-full max-h-[400px] rounded-2xl shadow-md bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-gray-800 overflow-hidden relative *:max-h-[400px] *:object-contain">
                                <${Luminova.Components.SmartMedia} url=${q.mediaUrl} lang=${lang} />
                            </div>
                        </div>
                    `}
                    
                    ${q.type === 'mcq' && html`
                        <div className="space-y-4 max-w-2xl mx-auto">
                            ${(q.options || q.optionsAr || []).map((opt, i) => {
                        const handleMCQClick = () => {
                            if (isFeedbackRevealed || (quiz.feedbackMode === 'immediate' && revealedQuestions.has(q.id))) return;
                            setAnswers(prev => ({ ...prev, [q.id]: i }));
                        };
                        return html`
                                <button key=${`opt-${q.id}-${i}`} onClick=${handleMCQClick}
                                    disabled=${isFeedbackRevealed || (quiz.feedbackMode === 'immediate' && revealedQuestions.has(q.id))}
                                    className=${`w-full text-start p-5 rounded-2xl border-2 transition-all duration-300 text-lg font-bold shadow-sm ${answers[q.id] === i ? 'border-rose-500 bg-rose-500/10 scale-[1.02] shadow-rose-500/10' : 'border-white/5 bg-white/2 hover:border-rose-400/30 hover:bg-white/4 hover:scale-[1.01] text-white/80 hover:text-white'} ${(isFeedbackRevealed || revealedQuestions.has(q.id)) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    <span className="inline-block w-8 h-8 rounded-full bg-white/5 text-center leading-8 mr-4 ml-4 text-sm">${String.fromCharCode(65 + i)}</span>
                                    ${opt}
                                </button>
                            `;
                        })}
                        </div>
                    `}

                    ${q.type === 'multi_select' && html`
                        <div className="space-y-4 max-w-2xl mx-auto">
                            ${(q.options || q.optionsAr || []).map((opt, i) => {
                const selected = answers[q.id] || [];
                const isSelected = selected.includes(i);
                const handleMultiClick = () => {
                    if (isFeedbackRevealed || (quiz.feedbackMode === 'immediate' && revealedQuestions.has(q.id))) return;
                    const next = isSelected ? selected.filter(x => x !== i) : [...selected, i];
                    setAnswers(prev => ({ ...prev, [q.id]: next }));
                };
                return html`
                                    <button key=${`opt-${q.id}-${i}`} disabled=${isFeedbackRevealed || (quiz.feedbackMode === 'immediate' && revealedQuestions.has(q.id))} onClick=${handleMultiClick}
                                    className=${`w-full text-start p-5 rounded-2xl border-2 transition-all duration-300 text-lg font-bold shadow-sm flex items-center gap-4 ${isSelected ? 'border-rose-500 bg-rose-500/10 scale-[1.02] shadow-rose-500/10' : 'border-white/5 bg-white/2 hover:border-rose-400/30 hover:bg-white/4 hover:scale-[1.01] text-white/80 hover:text-white'} ${(isFeedbackRevealed || revealedQuestions.has(q.id)) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                        <div className=${`w-8 h-8 rounded-xl flex items-center justify-center border-2 text-xl transition-all ${isSelected ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'border-white/20'}`}>
                                            ${isSelected && '✓'}
                                        </div>
                                        ${opt}
                                    </button>
                                `;
            })}
                        </div>
                    `}

                    ${q.type === 'essay' && html`
                        <div className="max-w-3xl mx-auto">
                            <textarea 
                                disabled=${isFeedbackRevealed || (quiz.feedbackMode === 'immediate' && revealedQuestions.has(q.id))}
                                className=${`w-full p-6 rounded-2xl bg-white/2 backdrop-blur-xl border border-white/10 focus:border-rose-500/50 focus:bg-white/4 outline-none min-h-[250px] text-lg text-white placeholder-white/20 transition-all shadow-inner resize-y ${(isFeedbackRevealed || revealedQuestions.has(q.id)) ? 'opacity-70 font-bold' : ''}`}
                                placeholder=${lang === 'ar' ? 'اكتب إجابتك بتفصيل هنا...' : 'Type your detailed answer here...'}
                                value=${answers[q.id] || ''}
                                onChange=${(e) => {
                            if (isFeedbackRevealed || (quiz.feedbackMode === 'immediate' && revealedQuestions.has(q.id))) return;
                            const val = e.target.value;
                            setAnswers(prev => ({ ...prev, [q.id]: val }));
                        }}
                            />
                        </div>
                    `}

                    ${(isFeedbackRevealed && quiz.feedbackMode === 'immediate') && html`
                        <div className="mt-10 p-6 rounded-2xl bg-white dark:bg-gray-900 border-2 border-brand-DEFAULT/40 shadow-xl animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-brand-DEFAULT to-transparent"></div>
                            <h4 className="font-black text-2xl mb-4">نتيجتك في هذا السؤال:</h4>
                            
                            ${q.type !== 'essay' && html`
                                <p className="flex items-start gap-2 mb-4" dangerouslySetInnerHTML=${{ __html: `<span class='font-bold opacity-70 min-w-[120px]'>النموذجية:</span> <strong class="text-green-600 dark:text-green-400 font-bold text-xl">${(q.type === 'mcq' ? (q.options || q.optionsAr)?.[q.correctAnswers?.[0]] : (q.correctAnswers || []).map(c => (q.options || q.optionsAr)?.[c]).join(' <span class="text-gray-400">|</span> '))}</strong>` }} />
                            `}
                            ${q.type === 'essay' && html`
                                <p className="font-bold opacity-70 border-b pb-2 mb-2">الإجابة النموذجية المرجعية:</p>
                                <p className="font-bold text-green-600 dark:text-green-400 text-lg mb-4 leading-relaxed">${q.modelAnswer || q.modelAnswerAr}</p>
                            `}

                            ${(q.explanation || q.explanationAr) && html`
                                <div className="mt-4 p-5 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/30 dark:to-gray-900 border border-amber-200 dark:border-amber-700/30 rounded-xl shadow-inner relative">
                                    <div className="absolute -top-3 -right-2 opacity-20 text-6xl">💡</div>
                                    <h5 className="font-black text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">💡 تعليل الإجابة:</h5>
                                    <p className="text-lg leading-relaxed font-bold text-gray-800 dark:text-gray-200">${(q.explanation || q.explanationAr)}</p>
                                </div>
                            `}
                        </div>
                    `}

                </div>
            </${Luminova.Components.GlassCard}>

            <div className="flex justify-between items-center bg-white/[0.03] backdrop-blur-2xl p-4 rounded-2xl shadow-lg border border-white/10">
                <${Luminova.Components.Button} variant="glass" disabled=${currentIndex === 0 || quiz.allowBackNavigation === false} onClick=${() => { setCurrentIndex(i => i - 1); if (quiz.feedbackMode === 'immediate' && questions[currentIndex - 1] && revealedQuestions.has(questions[currentIndex - 1].id)) { setIsFeedbackRevealed(true); } else { setIsFeedbackRevealed(false); } }} className="px-8 py-3 text-lg rounded-full">
                    ${lang === 'ar' ? 'السابق' : 'Previous'}
                </${Luminova.Components.Button}>
                
                ${quiz.feedbackMode === 'immediate' && !isFeedbackRevealed ? html`
                    <${Luminova.Components.Button} disabled=${answers[q.id] === undefined || (Array.isArray(answers[q.id]) && !answers[q.id].length)} onClick=${() => { setIsFeedbackRevealed(true); setRevealedQuestions(prev => new Set([...prev, q.id])); }} 
                        className="px-10 py-3 text-lg bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg shadow-blue-500/30 font-black animate-pulse transition-transform hover:scale-105">
                        ✅ تحقق من الإجابة
                    </${Luminova.Components.Button}>
                ` : currentIndex === questions.length - 1 ? html`
                    <${Luminova.Components.Button} onClick=${handleFinish} className="px-10 py-3 text-lg bg-green-500 hover:bg-green-600 rounded-full shadow-lg shadow-green-500/30 font-black animate-pulse">
                        <${Luminova.Icons.CheckCircle} /> ${lang === 'ar' ? 'إنهاء الاختبار' : 'Finish Exam'}
                    </${Luminova.Components.Button}>
                ` : html`
                    <${Luminova.Components.Button} onClick=${() => { setCurrentIndex(i => i + 1); if (quiz.feedbackMode === 'immediate' && questions[currentIndex + 1] && revealedQuestions.has(questions[currentIndex + 1].id)) { setIsFeedbackRevealed(true); } else { setIsFeedbackRevealed(false); } }} className="px-10 py-3 text-lg rounded-full shadow-lg shadow-brand-DEFAULT/30 group">
                        ${lang === 'ar' ? 'التالي' : 'Next'} <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                    </${Luminova.Components.Button}>
                `}
            </div>
        </div>
    `;
    };

    // ==========================================

})();
