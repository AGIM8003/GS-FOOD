import 'package:flutter/material.dart';
import 'dart:ui';

/// NOOR Design System - OLED Optimized Dark-First UI
/// Conforms to GS-FOOD3 UX requirements for True Black performance.

class NoorColors {
  // OLED Core
  static const Color trueBlack = Color(0xFF000000);
  static const Color elevatedDark = Color(0xFF121212);
  static const Color surfaceDark = Color(0xFF1A1A1A);
  
  // Text & Typography
  static const Color textPrimary = Color(0xFFEEEEEE); // Off-white for less strain
  static const Color textSecondary = Color(0xFFA0A0A0);
  
  // Desaturated Accents (OLED-friendly)
  static const Color primaryAction = Color(0xFF4A90E2);
  static const Color successSafe = Color(0xFF34C759); 
  static const Color warning = Color(0xFFFF9F0A);
  static const Color criticalRecall = Color(0xFFFF453A);
}

class NoorTheme {
  static ThemeData get oledDarkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: NoorColors.trueBlack,
      primaryColor: NoorColors.primaryAction,
      
      colorScheme: const ColorScheme.dark(
        background: NoorColors.trueBlack,
        surface: NoorColors.elevatedDark,
        primary: NoorColors.primaryAction,
        secondary: NoorColors.successSafe,
        error: NoorColors.criticalRecall,
        onBackground: NoorColors.textPrimary,
        onSurface: NoorColors.textPrimary,
      ),

      textTheme: const TextTheme(
        displayLarge: TextStyle(color: NoorColors.textPrimary, fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(color: NoorColors.textPrimary, height: 1.5),
        bodyMedium: TextStyle(color: NoorColors.textSecondary, height: 1.4),
      ),

      cardTheme: CardTheme(
        color: NoorColors.elevatedDark,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),

      appBarTheme: const AppBarTheme(
        backgroundColor: NoorColors.trueBlack,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: NoorColors.textPrimary),
        titleTextStyle: TextStyle(
          color: NoorColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Glassmorphic overlay for elevated components.
class NoorGlassContainer extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final double opacity;
  
  const NoorGlassContainer({
    Key? key,
    required this.child,
    this.borderRadius = 16.0,
    this.opacity = 0.6,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: NoorColors.surfaceDark.withOpacity(opacity),
            border: Border.all(
              color: Colors.white.withOpacity(0.08),
              width: 1,
            ),
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          child: child,
        ),
      ),
    );
  }
}
