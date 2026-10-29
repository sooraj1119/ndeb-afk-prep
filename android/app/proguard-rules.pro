# Project-specific ProGuard / R8 rules for NDEB AFK Prep

# Preserve source file and line numbers for Play Console crash reporting and stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor Core & Bridge
-keep public class * extends com.getcapacitor.Plugin {
    public *;
}
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keep public class com.dentalpreppro.afk.MainActivity { *; }

# RevenueCat Purchases SDK
-keep class com.revenuecat.purchases.** { *; }

# Capacitor Community Text-To-Speech
-keep class com.getcapacitor.community.tts.** { *; }

# Javascript Interface annotations for WebViews
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
