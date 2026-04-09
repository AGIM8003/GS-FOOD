import '../../app/services.dart';

class LanguageInfo {
  const LanguageInfo({
    required this.code,
    required this.label,
    required this.nativeLabel,
    required this.rtl,
  });

  final String code;
  final String label;
  final String nativeLabel;
  final bool rtl;
}

class LanguageEngine {
  static const List<LanguageInfo> supportedLanguages = [
    LanguageInfo(code: 'en', label: 'English', nativeLabel: 'English', rtl: false),
    LanguageInfo(code: 'ur', label: 'Urdu', nativeLabel: 'اردو', rtl: true),
    LanguageInfo(code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', rtl: false),
    LanguageInfo(code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', rtl: false),
    LanguageInfo(code: 'ar', label: 'Arabic', nativeLabel: 'العربية', rtl: true),
    LanguageInfo(code: 'fr', label: 'French', nativeLabel: 'Français', rtl: false),
    LanguageInfo(code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', rtl: false),
    // European Expansion
    LanguageInfo(code: 'es', label: 'Spanish', nativeLabel: 'Español', rtl: false),
    LanguageInfo(code: 'de', label: 'German', nativeLabel: 'Deutsch', rtl: false),
    LanguageInfo(code: 'it', label: 'Italian', nativeLabel: 'Italiano', rtl: false),
    LanguageInfo(code: 'pt', label: 'Portuguese', nativeLabel: 'Português', rtl: false),
    LanguageInfo(code: 'pl', label: 'Polish', nativeLabel: 'Polski', rtl: false),
    LanguageInfo(code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', rtl: false),
    LanguageInfo(code: 'ru', label: 'Russian', nativeLabel: 'Русский', rtl: false),
    LanguageInfo(code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', rtl: false),
    LanguageInfo(code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά', rtl: false),
    // Global Expansion
    LanguageInfo(code: 'zh', label: 'Mandarin', nativeLabel: '中文', rtl: false),
    LanguageInfo(code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', rtl: false),
    LanguageInfo(code: 'ja', label: 'Japanese', nativeLabel: '日本語', rtl: false),
    LanguageInfo(code: 'ko', label: 'Korean', nativeLabel: '한국어', rtl: false),
    LanguageInfo(code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', rtl: false),
  ];

  String _currentLang = 'en';
  bool _initialized = false;
  final Map<String, String> _dynamicCache = {};

  Future<void> init() async {
    if (_initialized) return;
    final prefs = await AppServices.preferences.load();
    _currentLang = prefs.language;
    _initialized = true;
  }

  void setLanguage(String code) {
    _currentLang = code;
  }

  String get currentLanguage => _currentLang;

  bool get isRTL {
    final info = supportedLanguages.firstWhere((l) => l.code == _currentLang, orElse: () => supportedLanguages.first);
    return info.rtl;
  }

  // Derived from NOOR dictionary pattern map.
  static const Map<String, Map<String, String>> _translations = {
    'en': {
      'home.title': 'GS Food Planner',
      'nav.home': 'Home',
      'nav.profile': 'Profile',
      'nav.shop': 'Shop',
      'nav.cook': 'Cook',
      'profile.title': 'Profile & Settings',
      'profile.settings': 'Settings',
      'profile.language': 'Language',
      'cook.synthesize': 'Synthesize Exact Match',
      'shop.checkout': '1-Click API Checkout',
      'hub.title': 'Kitchen Sync Hub',
    },
    'ur': {
      'home.title': 'جی ایس فوڈ پلانر',
      'nav.home': 'ہوم',
      'nav.profile': 'پروفائل',
      'nav.shop': 'خریداری',
      'nav.cook': 'پکائیں',
      'profile.title': 'پروفائل اور ترتیبات',
      'profile.settings': 'ترتیبات',
      'profile.language': 'زبان',
      'cook.synthesize': 'درست ترکیب بنائیں',
      'shop.checkout': '1-کلک چیک آؤٹ',
      'hub.title': 'کچن سنک ہب',
    },
    'id': {
      'home.title': 'Perencana Makanan GS',
      'nav.home': 'Beranda',
      'nav.profile': 'Profil',
      'nav.shop': 'Belanja',
      'nav.cook': 'Masak',
      'profile.title': 'Profil & Pengaturan',
      'profile.settings': 'Pengaturan',
      'profile.language': 'Bahasa',
      'cook.synthesize': 'Gunakan Semua Bahan Sisa',
      'shop.checkout': 'Checkout 1-Klik API',
      'hub.title': 'Pusat Sinkronisasi Dapur',
    },
    'bn': {
      'home.title': 'জিএস ফুড প্ল্যানার',
      'nav.home': 'হোম',
      'nav.profile': 'প্রোফাইল',
      'nav.shop': 'দোকান',
      'nav.cook': 'রান্না',
      'profile.title': 'প্রোফাইল এবং সেটিংস',
      'profile.settings': 'সেটিংস',
      'profile.language': 'ভাষা',
      'cook.synthesize': 'সঠিক ম্যাং সংশ্লেষ করুন',
      'shop.checkout': '১-ক্লিক এপিআই চেকআউট',
      'hub.title': 'রান্নাঘর সিঙ্ক হাব',
    },
    'ar': {
      'home.title': 'مخطط طعام GS',
      'nav.home': 'الرئيسية',
      'nav.profile': 'الملف الشخصي',
      'nav.shop': 'تسوق',
      'nav.cook': 'طبخ',
      'profile.title': 'الملف الشخصي والإعدادات',
      'profile.settings': 'الإعدادات',
      'profile.language': 'اللغة',
      'cook.synthesize': 'تركيب تطابق دقيق',
      'shop.checkout': 'الدفع بنقرة واحدة API',
      'hub.title': 'مركز مزامنة المطبخ',
    },
    'fr': {
      'home.title': 'Planificateur GS Food',
      'nav.home': 'Accueil',
      'nav.profile': 'Profil',
      'nav.shop': 'Achats',
      'nav.cook': 'Cuisiner',
      'profile.title': 'Profil & Paramètres',
      'profile.settings': 'Paramètres',
      'profile.language': 'Langue',
      'cook.synthesize': 'Zéro Déchet IA',
      'shop.checkout': 'Payer en 1-Clic API',
      'hub.title': 'Centre de Synchro Cuisine',
    },
    'tr': {
      'home.title': 'GS Yemek Planlayıcı',
      'nav.home': 'Ana Sayfa',
      'nav.profile': 'Profil',
      'nav.shop': 'Alışveriş',
      'nav.cook': 'Pişir',
      'profile.title': 'Profil ve Ayarlar',
      'profile.settings': 'Ayarlar',
      'profile.language': 'Dil',
      'cook.synthesize': 'Tam Eşleşme (Sıfır Atık)',
      'shop.checkout': '1-Tık API Ödeme',
      'hub.title': 'Mutfak Senkronizasyon',
    },
    'es': {
      'home.title': 'Planificador GS Food', 'nav.home': 'Inicio', 'nav.profile': 'Perfil', 'nav.shop': 'Comprar', 'nav.cook': 'Cocinar', 'profile.title': 'Perfil y Ajustes', 'profile.settings': 'Ajustes', 'profile.language': 'Idioma', 'cook.synthesize': 'Sintetizar Coincidencia', 'shop.checkout': 'Pago 1-Clic API', 'hub.title': 'Hub de Cocina',
    },
    'de': {
      'home.title': 'GS Essensplaner', 'nav.home': 'Startseite', 'nav.profile': 'Profil', 'nav.shop': 'Einkaufen', 'nav.cook': 'Kochen', 'profile.title': 'Profil & Einstellungen', 'profile.settings': 'Einstellungen', 'profile.language': 'Sprache', 'cook.synthesize': 'Genaue Entsprechung', 'shop.checkout': '1-Klick API-Kasse', 'hub.title': 'Küchen-Sync-Hub',
    },
    'it': {
      'home.title': 'Pianificatore GS Food', 'nav.home': 'Home', 'nav.profile': 'Profilo', 'nav.shop': 'Acquista', 'nav.cook': 'Cucina', 'profile.title': 'Profilo e Impostazioni', 'profile.settings': 'Impostazioni', 'profile.language': 'Lingua', 'cook.synthesize': 'Sintetizza Combinazione', 'shop.checkout': 'Checkout 1-Clic API', 'hub.title': 'Hub Sincronizzazione',
    },
    'pt': {
      'home.title': 'Planejador GS Food', 'nav.home': 'Início', 'nav.profile': 'Perfil', 'nav.shop': 'Comprar', 'nav.cook': 'Cozinhar', 'profile.title': 'Perfil e Configurações', 'profile.settings': 'Configurações', 'profile.language': 'Idioma', 'cook.synthesize': 'Sintetizar Correspondência', 'shop.checkout': 'Checkout 1-Clique API', 'hub.title': 'Hub de Sincronização',
    },
    'pl': {
      'home.title': 'Planer Jedzenia GS', 'nav.home': 'Główna', 'nav.profile': 'Profil', 'nav.shop': 'Sklep', 'nav.cook': 'Gotuj', 'profile.title': 'Profil i Ustawienia', 'profile.settings': 'Ustawienia', 'profile.language': 'Język', 'cook.synthesize': 'Syntetyzuj Dokładnie', 'shop.checkout': 'Kasa 1-Klik API', 'hub.title': 'Centrum Synchronizacji',
    },
    'nl': {
      'home.title': 'GS Voedselplanner', 'nav.home': 'Thuis', 'nav.profile': 'Profiel', 'nav.shop': 'Winkel', 'nav.cook': 'Koken', 'profile.title': 'Profiel & Instellingen', 'profile.settings': 'Instellingen', 'profile.language': 'Taal', 'cook.synthesize': 'Genereer Match', 'shop.checkout': '1-Klik API Afrekenen', 'hub.title': 'Keukensync Hub',
    },
    'ru': {
      'home.title': 'Планировщик GS Food', 'nav.home': 'Главная', 'nav.profile': 'Профиль', 'nav.shop': 'Магазин', 'nav.cook': 'Готовить', 'profile.title': 'Профиль и Настройки', 'profile.settings': 'Настройки', 'profile.language': 'Язык', 'cook.synthesize': 'Точное Совпадение', 'shop.checkout': 'Оплата 1-Клик API', 'hub.title': 'Центр Синхронизации',
    },
    'sv': {
      'home.title': 'GS Matplanerare', 'nav.home': 'Hem', 'nav.profile': 'Profil', 'nav.shop': 'Butik', 'nav.cook': 'Laga mat', 'profile.title': 'Profil & Inställningar', 'profile.settings': 'Inställningar', 'profile.language': 'Språk', 'cook.synthesize': 'Generera Exakt Match', 'shop.checkout': '1-Klick API-Utcheckning', 'hub.title': 'Köks-Sync Hub',
    },
    'el': {
      'home.title': 'GS Σχεδιαστής Φαγητού', 'nav.home': 'Αρχική', 'nav.profile': 'Προφίλ', 'nav.shop': 'Αγορά', 'nav.cook': 'Μαγειρέψτε', 'profile.title': 'Προφίλ & Ρυθμίσεις', 'profile.settings': 'Ρυθμίσεις', 'profile.language': 'Γλώσσα', 'cook.synthesize': 'Ακριβής Σύνθεση', 'shop.checkout': 'Ταμείο 1-Κλικ API', 'hub.title': 'Κέντρο Συγχρονισμού',
    },
    'zh': {
      'home.title': 'GS 食品规划器', 'nav.home': '主页', 'nav.profile': '个人资料', 'nav.shop': '商店', 'nav.cook': '烹饪', 'profile.title': '个人资料与设置', 'profile.settings': '设置', 'profile.language': '语言', 'cook.synthesize': '零浪费配方合成', 'shop.checkout': '一键API结账', 'hub.title': '厨房同步中心',
    },
    'hi': {
      'home.title': 'GS फूड प्लानर', 'nav.home': 'होम', 'nav.profile': 'प्रोफ़ाइल', 'nav.shop': 'दुकान', 'nav.cook': 'पकाएं', 'profile.title': 'प्रोफ़ाइल और सेटिंग्स', 'profile.settings': 'सेटिंग्स', 'profile.language': 'भाषा', 'cook.synthesize': 'सटीक सिंथेसाइज करें', 'shop.checkout': '1-क्लिक एपीआई चेकआउट', 'hub.title': 'किचन सिंक हब',
    },
    'ja': {
      'home.title': 'GS フードプランナー', 'nav.home': 'ホーム', 'nav.profile': 'プロフィール', 'nav.shop': 'ショップ', 'nav.cook': '料理する', 'profile.title': 'プロフィールと設定', 'profile.settings': '設定', 'profile.language': '言語', 'cook.synthesize': '完全一致を合成', 'shop.checkout': '1クリックAPIチェックアウト', 'hub.title': 'キッチン同期ハブ',
    },
    'ko': {
      'home.title': 'GS 푸드 플래너', 'nav.home': '홈', 'nav.profile': '프로필', 'nav.shop': '쇼핑', 'nav.cook': '요리하기', 'profile.title': '프로필 및 설정', 'profile.settings': '설정', 'profile.language': '언어', 'cook.synthesize': '정확한 매치 합성', 'shop.checkout': '1클릭 API 결제', 'hub.title': '주방 동기화 허브',
    },
    'sw': {
      'home.title': 'Mpangaji wa Chakula GS', 'nav.home': 'Nyumbani', 'nav.profile': 'Profaili', 'nav.shop': 'Duka', 'nav.cook': 'Pika', 'profile.title': 'Profaili na Mipangilio', 'profile.settings': 'Mipangilio', 'profile.language': 'Lugha', 'cook.synthesize': 'Unda Chakula', 'shop.checkout': 'Lipa kwa Bofyo 1 API', 'hub.title': 'Kituo cha Usawazishaji',
    }
  };

  /// Fetch translation key (Synchronous, relies heavily on Offline dicts or already-cached lookups).
  String t(String key) {
    if (!_initialized) return _translations['en']?[key] ?? key;
    
    // 1. Check dynamic cache first
    final cacheKey = '${_currentLang}_$key';
    if (_dynamicCache.containsKey(cacheKey)) return _dynamicCache[cacheKey]!;

    // 2. Check offline dictionary
    final dict = _translations[_currentLang] ?? _translations['en']!;
    if (dict.containsKey(key)) return dict[key]!;
    
    // 3. Fallback to english statically immediately if purely synchronous
    return _translations['en']?[key] ?? key;
  }

  /// Fetch translation deeply dynamically using AI orchestration fallback.
  Future<String> tAsync(String key, {String? defaultEnglishText}) async {
    if (!_initialized) return defaultEnglishText ?? _translations['en']?[key] ?? key;

    final cacheKey = '${_currentLang}_$key';
    if (_dynamicCache.containsKey(cacheKey)) return _dynamicCache[cacheKey]!;

    final dict = _translations[_currentLang] ?? _translations['en']!;
    if (dict.containsKey(key)) return dict[key]!;

    // If we get here, it's NOT translated offline. Call AI Fallback.
    final englishText = defaultEnglishText ?? _translations['en']?[key] ?? key;
    
    if (_currentLang == 'en') return englishText;

    final nativeLabel = supportedLanguages.firstWhere((l) => l.code == _currentLang, orElse: () => supportedLanguages.first).nativeLabel;
    
    // Contact openrouter/groq via onlineTranslator wrapper
    try {
       final translated = await AppServices.onlineTranslator.translateText(englishText, nativeLabel);
       _dynamicCache[cacheKey] = translated;
       return translated;
    } catch (_) {
       return englishText;
    }
  }
}
