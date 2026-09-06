package com.tylerbailly.myflix.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tylerbailly.myflix.network.GenreRow
import com.tylerbailly.myflix.network.Provider
import com.tylerbailly.myflix.network.Title
import com.tylerbailly.myflix.ui.common.PosterCard
import com.tylerbailly.myflix.ui.common.TopNavBar
import com.tylerbailly.myflix.ui.theme.BrandRed
import com.tylerbailly.myflix.ui.theme.SurfaceDark
import androidx.lifecycle.viewmodel.compose.viewModel

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
            HomeContent(data.hero?.name, data.hero?.description, data.hero?.backdropUrl)

            if (data.providers.isNotEmpty()) {
                TitleRow("Streaming Services") {
                    items(data.providers) { provider -> ProviderTile(provider, onClick = { onProviderClick(provider.slug) }) }
                }
            }
            if (data.preferredGenreTitles.isNotEmpty()) {
                PosterRow("Your Recommendations", data.preferredGenreTitles, onTitleClick)
            }
            if (data.comingSoon.isNotEmpty()) {
                PosterRow("Coming Soon", data.comingSoon, onTitleClick)
            }
            if (data.recommendations.isNotEmpty()) {
                PosterRow("Because you've watched", data.recommendations, onTitleClick)
            }
            data.genres.forEach { genre ->
                PosterRow(genre.name, genre.titles, onTitleClick)
            }
        }
    }
}

@Composable
private fun HomeContent(name: String?, description: String?, backdropUrl: String?) {
    Box(modifier = Modifier.fillMaxWidth().height(160.dp)) {
        if (backdropUrl != null) {
            AsyncImage(
                model = backdropUrl,
                contentDescription = name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }
        Column(modifier = Modifier.padding(16.dp)) {
            if (name != null) {
                Text(name, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground)
            }
            if (description != null) {
                Text(
                    description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onBackground,
                    maxLines = 1
                )
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
            .border(width = if (isFocused) 3.dp else 0.dp, color = BrandRed)
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
