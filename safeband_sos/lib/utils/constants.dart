import 'package:flutter/material.dart';

class AppColors {
  static const Color sosRed = Color(0xFFD50000); // Deep, sharp red
  static const Color background = Color(0xFFF5F5F5);
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
}

class AppTextStyles {
  static const TextStyle header = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
  );

  static const TextStyle body = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
  );
  
  static const TextStyle bodySecondary = TextStyle(
    fontSize: 18,
    color: AppColors.textSecondary,
  );
  
  static const TextStyle sosButtonText = TextStyle(
    fontSize: 48,
    fontWeight: FontWeight.w900,
    color: Colors.white,
    letterSpacing: 2.0,
  );
}
