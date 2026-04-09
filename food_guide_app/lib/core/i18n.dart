import 'package:flutter/material.dart';

class I18n {
  static final ValueNotifier<String> currentLanguage = ValueNotifier<String>('en');

  // Hardcoded Offline Language Engine (Modeled strictly on NOOR)
  static final Map<String, Map<String, String>> _translations = {
    'en': {
      'storage.title': 'Storage & Environment',
      'storage.search': 'Analyze shelf & fridge...',
      'storage.camera': 'Scan Fridge',
      'cook.title': 'Cooking Engine (AI)',
      'cook.generate': 'Generate Recipe',
      'cook.gps.locating': 'Locating active region...',
      'profile.title': 'Settings & Core',
      'profile.languages': 'Application Language',
      'profile.kitchens': 'Kitchens & Cuisines',
      'common.cancel': 'Cancel',
      'common.ok': 'OK',
    },
    'ur': {
      'storage.title': 'اسٹوریج اور ماحول',
      'storage.search': 'شیلف اور فریج کا تجزیہ کریں...',
      'storage.camera': 'فریج اسکین کریں',
      'cook.title': 'پکانے کا انجن (AI)',
      'cook.generate': 'ترکیب بنائیں',
      'cook.gps.locating': 'علاقہ تلاش کر رہا ہے...',
      'profile.title': 'ترتیبات اور کور',
      'profile.languages': 'ایپلیکیشن کی زبان',
      'profile.kitchens': 'کچن اور کھانے',
      'common.cancel': 'منسوخ',
      'common.ok': 'ٹھیک ہے',
    },
    'id': {
      'storage.title': 'Penyimpanan & Lingkungan',
      'storage.search': 'Analisis rak & kulkas...',
      'storage.camera': 'Pindai Kulkas',
      'cook.title': 'Mesin Memasak (AI)',
      'cook.generate': 'Hasilkan Resep',
      'cook.gps.locating': 'Mencari wilayah aktif...',
      'profile.title': 'Pengaturan & Inti',
      'profile.languages': 'Bahasa Aplikasi',
      'profile.kitchens': 'Dapur & Hidangan',
      'common.cancel': 'Batal',
      'common.ok': 'OK',
    },
    'bn': {
      'storage.title': 'স্টোরেজ ও পরিবেশ',
      'storage.search': 'তাক এবং ফ্রিজ বিশ্লেষণ করুন...',
      'storage.camera': 'ফ্রিজ স্ক্যান করুন',
      'cook.title': 'রন্ধন ইঞ্জিন (AI)',
      'cook.generate': 'রেসিপি তৈরি করুন',
      'cook.gps.locating': 'সক্রিয় অঞ্চল খুঁজছি...',
      'profile.title': 'সেটিংস এবং কোর',
      'profile.languages': 'অ্যাপ্লিকেশনের ভাষা',
      'profile.kitchens': 'রান্নাঘর এবং খাবার',
      'common.cancel': 'বাতিল',
      'common.ok': 'ঠিক আছে',
    },
    'fa': {
      'storage.title': 'ذخیره سازی و محیط',
      'storage.search': 'تجزیه و تحلیل قفسه...',
      'storage.camera': 'اسکن یخچال',
      'cook.title': 'موتور پخت و پز',
      'cook.generate': 'تولید دستور پخت',
      'cook.gps.locating': 'مکان یابی منطقه...',
      'profile.title': 'تنظیمات',
      'profile.languages': 'زبان برنامه',
      'profile.kitchens': 'آشپزخانه ها',
      'common.cancel': 'لغو',
      'common.ok': 'تایید',
    },
    'ru': {
      'storage.title': 'Хранение и среда',
      'storage.search': 'Анализ холодильника...',
      'storage.camera': 'Сканировать',
      'cook.title': 'ИИ кулинария',
      'cook.generate': 'Создать рецепт',
      'cook.gps.locating': 'Поиск региона...',
      'profile.title': 'Настройки',
      'profile.languages': 'Язык приложения',
      'profile.kitchens': 'Кухни',
      'common.cancel': 'Отмена',
      'common.ok': 'ОК',
    },
    'sw': {
      'storage.title': 'Uhifadhi na Mazingira',
      'storage.search': 'Changanua friji...',
      'storage.camera': 'Skan Friji',
      'cook.title': 'Injini ya Kupika (AI)',
      'cook.generate': 'Tengeneza Mapishi',
      'cook.gps.locating': 'Inatafuta eneo...',
      'profile.title': 'Mipangilio',
      'profile.languages': 'Lugha ya Programu',
      'profile.kitchens': 'Jiko na Vyakula',
      'common.cancel': 'Ghairi',
      'common.ok': 'Sawa',
    },
    // The rest of the 13 languages strictly map out to ensure the entire structure doesn't crash if called.
    'ku': {'storage.title': 'Depokirin û Jîngeh', 'profile.languages': 'Ziman'},
    'ha': {'storage.title': 'Ajiya & Muhalli', 'profile.languages': 'Harshe'},
    'kk': {'storage.title': 'Сақтау және орта', 'profile.languages': 'Тіл'},
    'uz': {'storage.title': 'Saqlash va atrof', 'profile.languages': 'Til'},
    'ms': {'storage.title': 'Penyimpanan & Persekitaran', 'profile.languages': 'Bahasa'},
    'ps': {'storage.title': 'ذخیره او چاپیریال', 'profile.languages': 'ژبه'},
    'pa': {'storage.title': 'ਸਟੋਰੇਜ ਅਤੇ ਵਾਤਾਵਰਣ', 'profile.languages': 'ਭਾਸ਼ਾ'},
    'tg': {'storage.title': 'Нигоҳдорӣ', 'profile.languages': 'Забон'},
    'az': {'storage.title': 'Saxlama və Mühit', 'profile.languages': 'Dil'},
    'ky': {'storage.title': 'Сактоо', 'profile.languages': 'Тил'},
    'tk': {'storage.title': 'Goramaly', 'profile.languages': 'Dil'},
    'ce': {'storage.title': 'Iалашдар', 'profile.languages': 'Мотт'},
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
