package com.tylerbailly.myflix.ui.home

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tylerbailly.myflix.network.NewRelease
import com.tylerbailly.myflix.network.Provider
import com.tylerbailly.myflix.network.Title
import com.tylerbailly.myflix.ui.common.PosterCard
import com.tylerbailly.myflix.ui.common.TopNavBar
import com.tylerbailly.myflix.ui.theme.BrandRed
import com.tylerbailly.myflix.ui.theme.FocusColor
import com.tylerbailly.myflix.ui.theme.SurfaceDark
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay

@Composable
fun HomeScreen(
    onTitleClick: (String) -> Unit,
    onProviderClick: (String) -> Unit,
    onFamilyVideos: () -> Unit,
    onMyList: () -> Unit,
    onSearch: () -> Unit,
    onComingSoon: () -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val home by viewModel.home.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TopNavBar(onHome = {}, onFamilyVideos = onFamilyVideos, onMyList = onMyList, onSearch = onSearch, onComingSoon = onComingSoon)

        val data = home
        if (error != null) {
            Text(error!!, color = BrandRed, modifier = Modifier.padding(24.dp))
        } else if (data == null) {
            Text("Loading...", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(24.dp))
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                if (data.newReleases.isNotEmpty()) {
                    item { NewReleasesCarousel(data.newReleases, onTitleClick) }
                }

                if (data.providers.isNotEmpty()) {
                    item {
                        TitleRow("Streaming Services") {
                            items(data.providers) { provider -> ProviderTile(provider, onClick = { onProviderClick(provider.slug) }) }
                        }
                    }
                }
                if (data.preferredGenreTitles.isNotEmpty()) {
                    item { PosterRow("Your Recommendations", data.preferredGenreTitles, onTitleClick) }
                }
                if (data.comingSoon.isNotEmpty()) {
                    item { PosterRow("Coming Soon", data.comingSoon, onTitleClick) }
                }
                if (data.recommendations.isNotEmpty()) {
                    item { PosterRow("Because you've watched", data.recommendations, onTitleClick) }
                }
                items(data.genres) { genre ->
                    PosterRow(genre.name, genre.titles, onTitleClick)
                }
            }
        }
    }
}

/** An auto-advancing banner cycling through the newest titles synced from subscribed providers. */
@Composable
private fun NewReleasesCarousel(releases: List<NewRelease>, onTitleClick: (String) -> Unit) {
    var index by remember(releases) { mutableIntStateOf(0) }

    LaunchedEffect(releases) {
        while (true) {
            delay(6000)
            index = (index + 1) % releases.size
        }
    }

    val current = releases[index]
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(220.dp)
            .border(width = if (isFocused) 3.dp else 0.dp, color = FocusColor)
            .clickable(interactionSource = interactionSource, indication = null) { onTitleClick(current.id) }
    ) {
        Crossfade(targetState = current, label = "newReleaseBackdrop") { release ->
            Box(modifier = Modifier.fillMaxSize()) {
                if (release.backdropUrl != null) {
                    AsyncImage(
                        model = release.backdropUrl,
                        contentDescription = release.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Column(modifier = Modifier.align(Alignment.BottomStart).padding(16.dp)) {
                    if (release.providerName != null) {
                        Text(
                            "NEW ON ${release.providerName.uppercase()}",
                            style = MaterialTheme.typography.labelSmall,
                            color = BrandRed
                        )
                    }
                    Text(release.name, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground)
                }
            }
        }
        if (releases.size > 1) {
            Row(
                modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                releases.indices.forEach { i ->
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (i == index) BrandRed else SurfaceDark)
                    )
                }
            }
        }
    }
}

@Composable
private fun PosterRow(heading: String, titles: List<Title>, onTitleClick: (String) -> Unit) {
    TitleRow(heading) {
        items(titles) { title ->
            PosterCard(name = title.name, posterUrl = title.posterUrl, badge = title.status, onClick = { onTitleClick(title.id) })
        }
    }
}

@Composable
private fun TitleRow(heading: String, content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit) {
    Column(modifier = Modifier.padding(top = 16.dp)) {
        Text(
            heading,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
        )
        LazyRow(contentPadding = PaddingValues(horizontal = 18.dp), content = content)
    }
}

@Composable
private fun ProviderTile(provider: Provider, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Box(
        modifier = Modifier
            .padding(6.dp)
            .height(80.dp)
            .background(SurfaceDark)
            .border(width = if (isFocused) 3.dp else 0.dp, color = FocusColor)
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick)
            .padding(horizontal = 20.dp),
    ) {
        Text(
            provider.name,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.align(androidx.compose.ui.Alignment.Center)
        )
    }
}
