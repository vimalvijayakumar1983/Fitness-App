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
};

export const DICTS: Record<Lang, Record<string, string>> = { en, ar };
