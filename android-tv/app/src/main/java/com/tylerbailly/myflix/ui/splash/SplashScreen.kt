package com.tylerbailly.myflix.ui.splash

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.tylerbailly.myflix.network.ApiClient

/**
 * Checks whether the persisted session (from a previous login) is still
 * valid before deciding where to send the user -- so reopening the app
 * goes straight to the profile picker like real Netflix, instead of asking
 * for a password every single time despite already being logged in.
 */
@Composable
fun SplashScreen(onLoggedIn: () -> Unit, onLoggedOut: () -> Unit) {
    LaunchedEffect(Unit) {
        try {
            ApiClient.apiService.profiles()
            onLoggedIn()
        } catch (e: Exception) {
            onLoggedOut()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
