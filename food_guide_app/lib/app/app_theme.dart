import 'package:flutter/material.dart';

abstract final class AppTheme {
  // NOOR-inspired Aesthetic: High-contrast pure black surfaces, glowing accents, premium glassmorphism.
  static const Color _seed = Color(0xFFFF6B00); // Glowing Vibrant Food Orange

  // Force Dark Mode NOOR aesthetic everywhere
  static ThemeData get light => dark; // Noor is dark-mode native

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF000000), // Pure OLED Black
        colorScheme: const ColorScheme.dark(
          primary: _seed,
          secondary: Color(0xFF00FF66), // Fresh vibrant green
          surface: Color(0xFF000000), // Base
          surfaceContainerHighest: Color(0xFF151515), // Deep grey for cards/containers
          onSurface: Colors.white,
          onSurfaceVariant: Color(0xFFAAAAAA),
        ),
        appBarTheme: const AppBarTheme(
          centerTitle: true, 
          scrolledUnderElevation: 0,
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: Colors.white),
          titleTextStyle: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.5),
        ),
        cardTheme: CardTheme(
          color: const Color(0xFF111111),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: Color(0xFF222222), width: 1), // Subtle NOOR-style borders
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: _seed,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            elevation: 0,
          ),
        ),
        fontFamily: 'Inter', // Sleek Geometric default fallback
        textTheme: const TextTheme(
          titleLarge: TextStyle(fontWeight: FontWeight.w700, letterSpacing: -1.0), // High impact headings
          bodyLarge: TextStyle(fontWeight: FontWeight.w400, letterSpacing: -0.2), // Clean body
        ),
      );
}
