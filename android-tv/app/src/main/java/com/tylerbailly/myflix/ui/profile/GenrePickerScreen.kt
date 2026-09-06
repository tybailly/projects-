package com.tylerbailly.myflix.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tylerbailly.myflix.ui.theme.BrandRed
import com.tylerbailly.myflix.ui.theme.SurfaceDark

@Composable
fun GenrePickerScreen(
    profileId: String,
    onDone: () -> Unit,
    viewModel: ProfileViewModel = viewModel()
) {
    val genres by viewModel.genres.collectAsState()
    var selected by remember { mutableStateOf(setOf<String>()) }

    LaunchedEffect(Unit) { viewModel.loadGenres() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.width(500.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("What do you want to watch?", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground)
            Text("Pick a few genres for your recommendations", color = MaterialTheme.colorScheme.onBackground)

            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                modifier = Modifier.padding(vertical = 16.dp)
            ) {
                items(genres ?: emptyList()) { genre ->
                    GenreChip(
                        label = genre.name,
                        isSelected = selected.contains(genre.id),
                        onClick = {
                            selected = if (selected.contains(genre.id)) selected - genre.id else selected + genre.id
                        }
                    )
                }
            }

            Button(
                onClick = { viewModel.saveGenresAndSelect(profileId, selected.toList(), onDone) },
                modifier = Modifier.width(240.dp)
            ) {
                Text("Save & Continue")
            }

            TextButton(onClick = { viewModel.selectProfile(profileId, onDone) }) {
                Text("Skip for now")
            }
        }
    }
}

@Composable
private fun GenreChip(label: String, isSelected: Boolean, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Box(
        modifier = Modifier
            .padding(4.dp)
            .background(if (isSelected) BrandRed else SurfaceDark, RoundedCornerShape(20.dp))
            .border(
                width = if (isFocused) 2.dp else 0.dp,
                color = MaterialTheme.colorScheme.onBackground,
                shape = RoundedCornerShape(20.dp)
            )
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(label, color = MaterialTheme.colorScheme.onPrimary)
    }
}
