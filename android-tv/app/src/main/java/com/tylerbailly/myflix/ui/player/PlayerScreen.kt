package com.tylerbailly.myflix.ui.player

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

@Composable
fun PlayerScreen(titleId: String, viewModel: PlayerViewModel = viewModel()) {
    val context = LocalContext.current
    val watch by viewModel.watch.collectAsState()

    LaunchedEffect(titleId) { viewModel.load(titleId) }

    val exoPlayer = remember { ExoPlayer.Builder(context).build() }

    DisposableEffect(Unit) {
        onDispose { exoPlayer.release() }
    }

    LaunchedEffect(watch) {
        val manifestUrl = watch?.manifestUrl ?: return@LaunchedEffect
        exoPlayer.setMediaItem(MediaItem.fromUri(manifestUrl))
        exoPlayer.prepare()
        exoPlayer.seekTo((watch?.startPositionSeconds ?: 0) * 1000L)
        exoPlayer.playWhenReady = true
    }

    // Periodically report position so "Continue Watching" reflects it.
    LaunchedEffect(exoPlayer) {
        while (isActive) {
            delay(5000)
            if (exoPlayer.isPlaying) {
                val positionSeconds = (exoPlayer.currentPosition / 1000).toInt()
                val durationSeconds = if (exoPlayer.duration > 0) (exoPlayer.duration / 1000).toInt() else null
                viewModel.reportProgress(titleId, positionSeconds, durationSeconds)
            }
        }
    }

    AndroidView(
        factory = { ctx ->
            PlayerView(ctx).apply {
                player = exoPlayer
                useController = true
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
