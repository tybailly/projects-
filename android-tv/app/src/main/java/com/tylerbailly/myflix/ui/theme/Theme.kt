package com.tylerbailly.myflix.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BrandBlack = Color(0xFF141414)
val BrandRed = Color(0xFFE50914)
val SurfaceDark = Color(0xFF1F1F1F)

private val MyFlixColorScheme = darkColorScheme(
    primary = BrandRed,
    background = BrandBlack,
    surface = SurfaceDark,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun MyFlixTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MyFlixColorScheme,
        content = content
    )
}
