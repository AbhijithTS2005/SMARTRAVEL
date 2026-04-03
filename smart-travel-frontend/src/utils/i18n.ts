export type Language = 'en' | 'ml';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.destinations': 'Destinations',
    'nav.travelPlans': 'Travel Plans',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.wishlist': 'Wishlist',
    'nav.packingList': 'Packing List',
    'nav.stats': 'Travel Stats',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.title': 'YOUR TRAVEL INTELLIGENCE',
    'dashboard.greeting.morning': 'Good Morning',
    'dashboard.greeting.afternoon': 'Good Afternoon',
    'dashboard.greeting.evening': 'Good Evening',
    'dashboard.forYou': 'PERSONALIZED FOR YOU',
    'dashboard.similarTravelers': 'COLLABORATIVE INTELLIGENCE',
    'dashboard.recentPlans': 'LIVE DATA',
    'dashboard.explore': 'EXPLORE DESTINATIONS',
    'dashboard.stats': 'YOUR DASHBOARD',
    'dashboard.subtitle': 'Travel intelligence, tailored for you.',

    // Common
    'common.viewDetails': 'View Details',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.tryAgain': 'Try Again',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.search': 'Search...',
    'common.noResults': 'No results found',
    'common.match': 'Match',
    'common.forYou': 'for you',
    'common.avgMatch': 'avg match',

    // Features
    'wishlist.title': 'Wishlist',
    'wishlist.subtitle': 'Destinations you\'ve saved for your next adventure.',
    'wishlist.empty': 'No saved destinations yet',
    'wishlist.emptyDesc': 'Browse destinations and tap the heart icon to save them here.',
    'packing.title': 'Packing List',
    'packing.subtitle': 'AI-generated packing checklist based on destination weather, terrain, and activities.',
    'stats.title': 'Travel Stats',
    'stats.subtitle': 'Your travel journey at a glance — trips, reviews, favorites, and more.',
    'reviews.title': 'Reviews & Ratings',
    'reviews.writeReview': 'Write Review',
    'reviews.submitReview': 'Submit Review',
    'reviews.noReviews': 'No reviews yet. Be the first to share your experience!',

    // Brand
    'brand.name': 'SMARTRAVEL',
    'brand.tagline': 'Nature-Powered Travel',
    'brand.copyright': '© 2026 SmartTravel',
  },
  ml: {
    // Navigation
    'nav.dashboard': 'ഡാഷ്ബോർഡ്',
    'nav.destinations': 'ലക്ഷ്യസ്ഥാനങ്ങൾ',
    'nav.travelPlans': 'യാത്രാ പദ്ധതികൾ',
    'nav.notifications': 'അറിയിപ്പുകൾ',
    'nav.settings': 'ക്രമീകരണങ്ങൾ',
    'nav.wishlist': 'ആഗ്രഹപ്പട്ടിക',
    'nav.packingList': 'പാക്കിംഗ് ലിസ്റ്റ്',
    'nav.stats': 'യാത്രാ സ്ഥിതിവിവരം',
    'nav.logout': 'ലോഗൗട്ട്',

    // Dashboard
    'dashboard.title': 'നിങ്ങളുടെ യാത്രാ ബുദ്ധി',
    'dashboard.greeting.morning': 'സുപ്രഭാതം',
    'dashboard.greeting.afternoon': 'ശുഭ ഉച്ചതിരിഞ്ഞ്',
    'dashboard.greeting.evening': 'ശുഭ സന്ധ്യ',
    'dashboard.forYou': 'നിങ്ങൾക്കായി',
    'dashboard.similarTravelers': 'സമാന യാത്രക്കാർ',
    'dashboard.recentPlans': 'തത്സമയ ഡാറ്റ',
    'dashboard.explore': 'ലക്ഷ്യസ്ഥാനങ്ങൾ കണ്ടെത്തുക',
    'dashboard.stats': 'നിങ്ങളുടെ ഡാഷ്ബോർഡ്',
    'dashboard.subtitle': 'നിങ്ങൾക്കായി രൂപകൽപ്പന ചെയ്ത യാത്രാ ബുദ്ധി.',

    // Common
    'common.viewDetails': 'വിശദാംശങ്ങൾ കാണുക',
    'common.loading': 'ലോഡ് ചെയ്യുന്നു...',
    'common.error': 'എന്തോ തെറ്റ് സംഭവിച്ചു',
    'common.tryAgain': 'വീണ്ടും ശ്രമിക്കുക',
    'common.save': 'സേവ് ചെയ്യുക',
    'common.cancel': 'റദ്ദാക്കുക',
    'common.delete': 'ഇല്ലാതാക്കുക',
    'common.search': 'തിരയുക...',
    'common.noResults': 'ഫലങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല',
    'common.match': 'പൊരുത്തം',
    'common.forYou': 'നിങ്ങൾക്കായി',
    'common.avgMatch': 'ശരാശരി പൊരുത്തം',

    // Features
    'wishlist.title': 'ആഗ്രഹപ്പട്ടിക',
    'wishlist.subtitle': 'നിങ്ങളുടെ അടുത്ത സാഹസികതയ്ക്കായി സേവ് ചെയ്ത ലക്ഷ്യസ്ഥാനങ്ങൾ.',
    'wishlist.empty': 'സേവ് ചെയ്ത ലക്ഷ്യസ്ഥാനങ്ങൾ ഇല്ല',
    'wishlist.emptyDesc': 'ലക്ഷ്യസ്ഥാനങ്ങൾ ബ്രൗസ് ചെയ്ത് ഹാർട്ട് ഐക്കൺ ടാപ്പ് ചെയ്ത് ഇവിടെ സേവ് ചെയ്യുക.',
    'packing.title': 'പാക്കിംഗ് ലിസ്റ്റ്',
    'packing.subtitle': 'ലക്ഷ്യസ്ഥാന കാലാവസ്ഥ, ഭൂപ്രകൃതി, പ്രവർത്തനങ്ങൾ എന്നിവ അടിസ്ഥാനമാക്കിയ AI പാക്കിംഗ് ചെക്ക്‌ലിസ്റ്റ്.',
    'stats.title': 'യാത്രാ സ്ഥിതിവിവരം',
    'stats.subtitle': 'നിങ്ങളുടെ യാത്രാ യാത്ര ഒറ്റ നോട്ടത്തിൽ.',
    'reviews.title': 'അവലോകനങ്ങൾ & റേറ്റിംഗുകൾ',
    'reviews.writeReview': 'അവലോകനം എഴുതുക',
    'reviews.submitReview': 'അവലോകനം സമർപ്പിക്കുക',
    'reviews.noReviews': 'ഇതുവരെ അവലോകനങ്ങളില്ല. നിങ്ങളുടെ അനുഭവം പങ്കിടുന്ന ആദ്യത്തെയാളാകൂ!',

    // Brand
    'brand.name': 'സ്മാർട്രാവൽ',
    'brand.tagline': 'പ്രകൃതി-ശക്തമായ യാത്ര',
    'brand.copyright': '© 2026 സ്മാർട്രാവൽ',
  },
};

export function getTranslation(lang: Language, key: string): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}
