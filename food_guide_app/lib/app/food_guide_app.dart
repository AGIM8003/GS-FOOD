import 'package:flutter/material.dart';

import '../bootstrap/app_bootstrap.dart';
import 'app_theme.dart';
import 'main_shell.dart';

/// Root widget — GS-FOOD3 §11 Flutter shell; primary tabs §17.3.
class FoodGuideApp extends StatelessWidget {
  const FoodGuideApp({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: AppBootstrap.ensureInitialized(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return MaterialApp(
            home: Scaffold(
              body: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Startup failed: ${snapshot.error}',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          );
        }
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            theme: AppTheme.light,
            home: const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }
        return MaterialApp(
          title: 'Food Guide',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: ThemeMode.system,
          home: const MainShell(),
        );
      },
    );
  }
}
