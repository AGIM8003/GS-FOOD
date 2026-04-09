import 'package:flutter/material.dart';

class I18n {
  static final ValueNotifier<String> currentLanguage = ValueNotifier<String>('en');

  // NOOR-Style Translation Dictionary
  static final Map<String, Map<String, String>> _translations = {
    'en': {
      'home.greeting': 'Assalamu Alaikum',
      'home.searchPlaceholder': 'Discover recipes, ask AI...',
      'home.action.cook': 'Start Cooking',
      'home.action.rescue': 'Rescue Food',
      'home.action.plan': 'Meal Plan',
      'home.expiringSoon': 'Expiring Soon',
      'home.expiringSub': 'Rescue these items before they go bad.',
      'cook.generate': 'Generate Meal Ideas',
      'pantry.title': 'My Pantry',
      'profile.title': 'Profile & Settings',
      'profile.languages': 'Language',
      'settings.restartMessage': 'Restart required to apply language properly.',
      'common.cancel': 'Cancel',
      'common.ok': 'OK',
    },
    'ur': {
      'home.greeting': 'السلام علیکم',
      'home.searchPlaceholder': 'ترکیبیں دریافت کریں...',
      'home.action.cook': 'کھانا پکائیں',
      'home.action.rescue': 'کھانا محفوظ کریں',
      'home.action.plan': 'کھانے کا منصوبہ',
      'home.expiringSoon': 'جلد ختم ہونے والا',
      'home.expiringSub': 'خراب ہونے سے پہلے انہیں استعمال کریں۔',
      'cook.generate': 'کھانے کے آئیڈیاز بنائیں',
      'pantry.title': 'میری پینٹری',
      'profile.title': 'پروفائل اور ترتیبات',
      'profile.languages': 'زبانیں',
      'settings.restartMessage': 'زبان تبدیل کرنے کے لیے دوبارہ شروع کریں۔',
      'common.cancel': 'منسوخ',
      'common.ok': 'ٹھیک ہے',
    },
    'id': {
      'home.greeting': 'Assalamu Alaikum',
      'home.searchPlaceholder': 'Cari resep, tanya AI...',
      'home.action.cook': 'Mulai Memasak',
      'home.action.rescue': 'Selamatkan Makanan',
      'home.action.plan': 'Rencana Makan',
      'home.expiringSoon': 'Segera Kadaluwarsa',
      'home.expiringSub': 'Gunakan bahan ini sebelum rusak.',
      'cook.generate': 'Hasilkan Ide Makan',
      'pantry.title': 'Dapur Saya',
      'profile.title': 'Profil & Pengaturan',
      'profile.languages': 'Bahasa',
      'settings.restartMessage': 'Perlu mulai ulang untuk menerapkan bahasa.',
      'common.cancel': 'Batal',
      'common.ok': 'OK',
    },
    'bn': {
      'home.greeting': 'আস-সালামু আলাইকুম',
      'home.searchPlaceholder': 'রেসিপি খুঁজুন, AI কে জিজ্ঞাসা করুন...',
      'home.action.cook': 'রান্না শুরু করুন',
      'home.action.rescue': 'খাদ্য উদ্ধার করুন',
      'home.action.plan': 'খাবারের পরিকল্পনা',
      'home.expiringSoon': 'শীঘ্রই মেয়াদ শেষ হচ্ছে',
      'home.expiringSub': 'নষ্ট হওয়ার আগে এগুলো ব্যবহার করুন।',
      'cook.generate': 'খাবারের ধারণা তৈরি করুন',
      'pantry.title': 'আমার প্যান্ট্রি',
      'profile.title': 'প্রোফাইল এবং সেটিংস',
      'profile.languages': 'ভাষা',
      'settings.restartMessage': 'ভাষা প্রয়োগ করতে পুনরায় চালু করুন।',
      'common.cancel': 'বাতিল',
      'common.ok': 'ঠিক আছে',
    }
  };

  static String get(String key) {
    String lang = currentLanguage.value;
    if (_translations[lang] != null && _translations[lang]!.containsKey(key)) {
      return _translations[lang]![key]!;
    }
    // Fallback to English
    if (_translations['en']!.containsKey(key)) {
      return _translations['en']![key]!;
    }
    return key;
  }

  static void setLanguage(String langCode) {
    if (_translations.containsKey(langCode)) {
      currentLanguage.value = langCode;
    }
  }
}
