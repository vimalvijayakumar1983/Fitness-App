/**
 * Lightweight i18n dictionaries. English is the source of truth; Arabic is
 * provided for the UAE market. Translate the most visible surfaces first
 * (navigation, dashboard, account, common actions); screens can adopt `t()`
 * incrementally — any missing key falls back to English, then the key itself.
 */

export type Lang = 'en' | 'ar';

export const RTL_LANGS: Lang[] = ['ar'];

export const en = {
  // Navigation
  'nav.today': 'Today',
  'nav.meals': 'Meals',
  'nav.plan': 'Plan',
  'nav.care': 'Care',
  'nav.exercise': 'Exercise',
  'nav.mind': 'Mind',
  'nav.sleep': 'Sleep',
  // Greetings
  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
  // Dashboard
  'dash.todaysFocus': "Today's focus",
  'dash.activityRings': 'Activity rings',
  'dash.nutrition': 'Nutrition',
  'dash.metabolicHealth': 'Metabolic health',
  'dash.weight': 'Weight',
  'dash.biologicalAge': 'Biological age',
  'dash.longevity': 'longevity',
  'dash.weekInReview': 'Your week in review',
  'dash.weekInReviewSub': 'Trends, wins & insights from your data',
  'dash.glucoseCta': 'Track your glucose',
  'dash.familyCta': 'Add your family',
  'dash.labCta': 'Analyze a lab report',
  'dash.coachCta': 'Ask your AI Coach',
  // Common
  'common.takeAssessment': 'Take assessment',
  'common.logWeight': 'Log weight',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  // Account
  'account.title': 'Account',
  'account.yourAccount': 'Your account',
  'account.welcomeBack': 'Welcome back',
  'account.createAccount': 'Create account',
  'account.signOut': 'Sign out',
  'account.language': 'Language',
  'account.privacy': 'Privacy & data',
  'account.exportData': 'Export my data',
  'account.deleteAccount': 'Delete account',
  'account.deleteConfirm': 'Permanently delete your account and all data? This cannot be undone.',
  'account.privacyNote': 'Your health data is yours. Export it any time, or delete your account and everything is erased.',
  'account.reminders': 'Reminders',
  'account.remDaily': 'Daily log reminder',
  'account.remGlucose': 'Morning glucose reminder',
  'account.remWeekly': 'Weekly review (Sun)',

  // Meals screen
  'meals.subtitle': 'Nutrition',
  'meals.today': 'Today',
  'meals.water': 'Water',
  'meals.logMeal': 'Log a meal',
  'meals.snap': '📸 Snap or scan a meal',
  'meals.search': '🔍 Search foods',
  'meals.quickAdd': 'or quick add',
  'meals.food': 'Food',
  'meals.caloriesOpt': 'Calories (optional)',
  'meals.addManual': 'Add manually',
  'meals.todays': "Today's meals",
  'meals.empty': 'No meals logged yet today. Search foods or quick-add above.',

  // Exercise screen
  'exercise.subtitle': 'Movement',
  'exercise.smartwatch': 'Smartwatch',
  'exercise.syncNow': 'Sync now',
  'exercise.connectDevice': 'Connect a device',
  'exercise.logWorkout': 'Log a workout',
  'exercise.browse': '🏋️ Browse exercise library',
  'exercise.activity': 'Activity',
  'exercise.duration': 'Duration (min)',
  'exercise.caloriesOpt': 'Calories burned (optional)',
  'exercise.add': 'Add workout',
  'exercise.todays': "Today's activity",
  'exercise.empty': 'Nothing logged yet. Sync your watch or add a workout above.',

  // Mind / Sleep / Plan
  'mind.subtitle': 'Wellbeing',
  'sleep.subtitle': 'Recovery',
  'plan.subtitle': 'Your meal planner',

  // Care screen
  'care.subtitle': 'Programs · Coaching · Workplace',
  'care.programs': 'Reversal programs',
  'care.coaching': '1:1 Coaching',
  'care.workplace': 'Workplace wellness',
  'care.findCoach': 'Find a coach',
  'care.manageCoaching': 'Manage coaching',
};

export type StringKey = keyof typeof en;

export const ar: Record<StringKey, string> = {
  'nav.today': 'اليوم',
  'nav.meals': 'الوجبات',
  'nav.plan': 'الخطة',
  'nav.care': 'الرعاية',
  'nav.exercise': 'التمارين',
  'nav.mind': 'الذهن',
  'nav.sleep': 'النوم',
  'greeting.morning': 'صباح الخير',
  'greeting.afternoon': 'مساء الخير',
  'greeting.evening': 'مساء الخير',
  'dash.todaysFocus': 'تركيز اليوم',
  'dash.activityRings': 'حلقات النشاط',
  'dash.nutrition': 'التغذية',
  'dash.metabolicHealth': 'الصحة الأيضية',
  'dash.weight': 'الوزن',
  'dash.biologicalAge': 'العمر البيولوجي',
  'dash.longevity': 'طول العمر',
  'dash.weekInReview': 'مراجعة أسبوعك',
  'dash.weekInReviewSub': 'الاتجاهات والإنجازات ورؤى من بياناتك',
  'dash.glucoseCta': 'تتبّع سكر الدم',
  'dash.familyCta': 'أضف عائلتك',
  'dash.labCta': 'تحليل تقرير المختبر',
  'dash.coachCta': 'اسأل مدربك الذكي',
  'common.takeAssessment': 'إجراء التقييم',
  'common.logWeight': 'تسجيل الوزن',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.close': 'إغلاق',
  'account.title': 'الحساب',
  'account.yourAccount': 'حسابك',
  'account.welcomeBack': 'مرحباً بعودتك',
  'account.createAccount': 'إنشاء حساب',
  'account.signOut': 'تسجيل الخروج',
  'account.language': 'اللغة',
  'account.privacy': 'الخصوصية والبيانات',
  'account.exportData': 'تصدير بياناتي',
  'account.deleteAccount': 'حذف الحساب',
  'account.deleteConfirm': 'حذف حسابك وكل بياناتك نهائياً؟ لا يمكن التراجع عن هذا.',
  'account.privacyNote': 'بياناتك الصحية ملكك. صدّرها في أي وقت، أو احذف حسابك ليُمحى كل شيء.',
  'account.reminders': 'التذكيرات',
  'account.remDaily': 'تذكير التسجيل اليومي',
  'account.remGlucose': 'تذكير سكر الدم صباحاً',
  'account.remWeekly': 'المراجعة الأسبوعية (الأحد)',

  'meals.subtitle': 'التغذية',
  'meals.today': 'اليوم',
  'meals.water': 'الماء',
  'meals.logMeal': 'تسجيل وجبة',
  'meals.snap': '📸 صوّر أو امسح وجبة',
  'meals.search': '🔍 البحث عن الأطعمة',
  'meals.quickAdd': 'أو إضافة سريعة',
  'meals.food': 'الطعام',
  'meals.caloriesOpt': 'السعرات (اختياري)',
  'meals.addManual': 'إضافة يدوية',
  'meals.todays': 'وجبات اليوم',
  'meals.empty': 'لا توجد وجبات مسجلة اليوم بعد. ابحث عن الأطعمة أو أضف سريعاً أعلاه.',

  'exercise.subtitle': 'الحركة',
  'exercise.smartwatch': 'الساعة الذكية',
  'exercise.syncNow': 'مزامنة الآن',
  'exercise.connectDevice': 'ربط جهاز',
  'exercise.logWorkout': 'تسجيل تمرين',
  'exercise.browse': '🏋️ تصفّح مكتبة التمارين',
  'exercise.activity': 'النشاط',
  'exercise.duration': 'المدة (دقيقة)',
  'exercise.caloriesOpt': 'السعرات المحروقة (اختياري)',
  'exercise.add': 'إضافة تمرين',
  'exercise.todays': 'نشاط اليوم',
  'exercise.empty': 'لا شيء مسجّل بعد. زامن ساعتك أو أضف تمريناً أعلاه.',

  'mind.subtitle': 'العافية',
  'sleep.subtitle': 'التعافي',
  'plan.subtitle': 'مخطط وجباتك',

  'care.subtitle': 'البرامج · الإرشاد · مكان العمل',
  'care.programs': 'برامج العكس',
  'care.coaching': 'إرشاد فردي',
  'care.workplace': 'عافية مكان العمل',
  'care.findCoach': 'ابحث عن مدرب',
  'care.manageCoaching': 'إدارة الإرشاد',
};

export const DICTS: Record<Lang, Record<string, string>> = { en, ar };
