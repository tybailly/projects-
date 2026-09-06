package com.tylerbailly.myflix.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.Profile

/**
 * Temporary screen proving the full auth chain works end-to-end (persisted
 * session cookie -> authenticated API call) before building the real
 * D-pad-navigable browsing UI in the next phase.
 */
@Composable
fun PlaceholderHomeScreen() {
    var profiles by remember { mutableStateOf<List<Profile>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            profiles = ApiClient.apiService.profiles()
        } catch (e: Exception) {
            error = e.message ?: "Failed to load profiles"
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Logged in!", style = MaterialTheme.typography.headlineMedium)
            when {
                error != null -> Text("Error: $error", color = MaterialTheme.colorScheme.error)
                profiles == null -> CircularProgressIndicator()
                else -> profiles!!.forEach { profile -> Text("- ${profile.name}") }
            }
        }
    }
}
