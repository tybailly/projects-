package com.tylerbailly.myflix.ui.title

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.tylerbailly.myflix.network.TitleDetail
import com.tylerbailly.myflix.ui.theme.BrandRed

@Composable
fun TitleDetailScreen(
    titleId: String,
    onPlayUpload: (String) -> Unit,
    viewModel: TitleDetailViewModel = viewModel()
) {
    val title by viewModel.title.collectAsState()
    val error by viewModel.error.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(titleId) { viewModel.load(titleId) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        val t = title
        if (error != null) {
            Text(error!!, color = BrandRed, modifier = Modifier.padding(24.dp))
        } else if (t == null) {
            Text("Loading...", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(24.dp))
        } else {
            if (t.backdropUrl != null) {
                AsyncImage(
                    model = t.backdropUrl,
                    contentDescription = t.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(320.dp)
                )
            }

            Column(modifier = Modifier.padding(24.dp)) {
                Text(t.name, style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.onBackground)

                Row(modifier = Modifier.padding(vertical = 8.dp)) {
                    t.releaseYear?.let { Text("$it  ", color = MaterialTheme.colorScheme.onBackground) }
                    t.maturityRating?.let { Text("$it  ", color = MaterialTheme.colorScheme.onBackground) }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.padding(vertical = 8.dp)) {
                    if (t.status == "READY") {
                        Button(onClick = { handlePlay(t, context, onPlayUpload) }) {
                            Text(t.play?.label ?: "Play")
                        }
                    } else {
                        Text(
                            if (t.status == "FAILED") "Processing failed for this title." else "Still processing, not playable yet.",
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    OutlinedButton(onClick = { viewModel.toggleWatchlist(t.id) }) {
                        Text(if (t.inWatchlist) "Remove from My List" else "Add to My List")
                    }
                }

                t.provider?.let {
                    Text("Available on ${it.name}", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(top = 4.dp))
                }

                t.description?.let {
                    Text(it, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(top = 12.dp))
                }

                if (t.genreNames.isNotEmpty()) {
                    Text("Genres: ${t.genreNames.joinToString(", ")}", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(top = 8.dp))
                }
                t.director?.let { Text("Director: $it", color = MaterialTheme.colorScheme.onBackground) }
                t.cast?.let { Text("Starring: $it", color = MaterialTheme.colorScheme.onBackground) }
            }
        }
    }
}

/**
 * Mirrors getPlayAction() from the web app: PROVIDER titles deep-link out
 * (Android resolves to the installed streaming app or a browser), TRAILER
 * titles deep-link to the YouTube app rather than embedding a player, and
 * UPLOAD titles play inline via this app's own ExoPlayer screen.
 */
private fun handlePlay(title: TitleDetail, context: android.content.Context, onPlayUpload: (String) -> Unit) {
    val play = title.play ?: return
    when {
        play.external -> context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(play.href)))
        title.source == "TRAILER" && title.trailerKey != null ->
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/watch?v=${title.trailerKey}")))
        else -> onPlayUpload(title.id)
    }
}
