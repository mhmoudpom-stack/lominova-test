// js/core.js

// 1. Initialize React Global Shortcuts for Vanilla Environment
window.html = window.htm.bind(window.React.createElement);
window.useState = window.React.useState;
window.useEffect = window.React.useEffect;
window.useMemo = window.React.useMemo;
window.useCallback = window.React.useCallback;

// 2. Initialize the Global Architecture Namespace
window.__LUMINOVA = { Core: {}, Components: {}, Pages: {}, Icons: {} };
const Luminova = window.__LUMINOVA;

// 3. Core Foundation Variables
Luminova.FOUNDER = {
    id: 's_founder_hardcoded', nameAr: 'محمود عبد الرحمن عبدالله', nameEn: 'Mahmoud Abdelrahman', isFounder: true, isVIP: true, isVerified: true,
    image: 'img/profile.png', majorAr: 'تكنولوجيا التعليم', majorEn: 'Educational Technology',
    socialLinks: { facebook: 'https://www.facebook.com/mahmoud.abdalrahaman.hagag', instagram: 'https://www.instagram.com/mahmoud_abdelrhman_1', linkedin: 'https://www.linkedin.com/in/mahmoud-hagag-145127346/' }
};

// 4. Core Helper Functions
Luminova.getStudent = (id, studentsList) => {
    if (!id) return { id: 'unknown', nameAr: 'غير معروف', nameEn: 'Unknown' };
    if (id === Luminova.FOUNDER.id || id === 's_founder' || id === 's_founder_hardcoded') return Luminova.FOUNDER;
    return (studentsList || []).find(s => s.id === id) || { id: 'unknown', nameAr: 'غير معروف', nameEn: 'Unknown' };
};

Luminova.formatDate = (dateString, lang) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// 5. App Dictionary (i18n)
Luminova.i18n = {
    ar: {
        appName: "Luminova Edu", home: "الرئيسية", community: "مجتمع الطلاب", academic: "المكتبة الأكاديمية",
        adminToggle: "الإدارة", founder: "المؤسس", vip: "مميز", verified: "موثوق",
        readMore: "عرض المزيد", readLess: "عرض أقل", searchPlaceholder: "ابحث هنا...", emptyState: "لا يوجد بيانات لعرضها.",
        years: "الفرق الدراسية", semesters: "الفصول الدراسية", subjects: "المواد الدراسية",
        summaries: "التلخيصات", quizzes: "الاختبارات", startQuiz: "بدء الاختبار", questions: "الأسئلة",
        quitWarning: "هل أنت متأكد من الخروج؟ سيتم فقدان التقدم.", score: "الدرجة",
        modelAnswer: "الإجابة النموذجية:", explanation: "التعليل:",
        deleteProtected: "لا يمكن الحذف.. الرجاء مسح المحتويات الداخلية أولاً",
        save: "حفظ", delete: "حذف", cancel: "إلغاء", exportData: "سحب الكود (Export initialData)",
        logout: "خروج الإدارة", passwordPrompt: "أدخل كلمة سر الإدارة:", wrongPassword: "كلمة السر خاطئة!",
        major: "التخصص", correct: "إجابة صحيحة", wrong: "إجابة خاطئة", results: "النتائج",
        topContributors: "شرف المساهمين 🏆", news: "أحدث الأخبار 📢", feed: "الخلاصة 🔥"
    },
    en: {
        appName: "Luminova Edu", home: "Home", community: "Community", academic: "Academic Library",
        adminToggle: "Admin", founder: "Founder", vip: "VIP", verified: "Verified",
        readMore: "Read More", readLess: "Read Less", searchPlaceholder: "Search...", emptyState: "No data available.",
        years: "Academic Years", semesters: "Semesters", subjects: "Subjects",
        summaries: "Summaries", quizzes: "Quizzes", startQuiz: "Start Quiz", questions: "Questions",
        quitWarning: "Are you sure you want to quit? Progress will be lost.", score: "Score",
        modelAnswer: "Model Answer:", explanation: "Explanation:",
        deleteProtected: "Cannot delete. Please remove inner contents first.",
        save: "Save", delete: "Delete", cancel: "Cancel", exportData: "Export initialData Code",
        logout: "Admin Logout", passwordPrompt: "Enter admin password:", wrongPassword: "Wrong password!",
        major: "Major", correct: "Correct", wrong: "Wrong", results: "Results",
        topContributors: "Top Contributors 🏆", news: "Latest News 📢", feed: "The Feed 🔥"
    }
};
