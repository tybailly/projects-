package com.tylerbailly.myflix.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tylerbailly.myflix.network.Profile
import com.tylerbailly.myflix.ui.theme.BrandRed
import com.tylerbailly.myflix.ui.theme.FocusColor
import com.tylerbailly.myflix.ui.theme.SurfaceDark

@Composable
fun ProfilePickerScreen(
    onProfileSelected: () -> Unit,
    onAddProfile: () -> Unit,
    viewModel: ProfileViewModel = viewModel()
) {
    val profiles by viewModel.profiles.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadProfiles() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Who's Watching?", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.onBackground)
            Box(modifier = Modifier.padding(top = 32.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    profiles?.forEach { profile ->
                        ProfileTile(label = profile.name, glyph = profile.name.take(2).uppercase()) {
                            viewModel.selectProfile(profile.id, onProfileSelected)
                        }
                    }
                    ProfileTile(label = "Add Profile", glyph = "+", onClick = onAddProfile)
                }
            }
            if (error != null) {
                Text(error!!, color = BrandRed, modifier = Modifier.padding(top = 16.dp))
            }
        }
    }
}

@Composable
private fun ProfileTile(label: String, glyph: String, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(120.dp)
                .background(SurfaceDark)
                .border(width = if (isFocused) 3.dp else 0.dp, color = FocusColor)
                .clickable(interactionSource = interactionSource, indication = null, onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Text(glyph, style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.onSurface)
        }
        Text(label, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(top = 8.dp))
    }
}
