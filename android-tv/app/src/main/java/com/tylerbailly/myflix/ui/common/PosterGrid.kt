package com.tylerbailly.myflix.ui.common

import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tylerbailly.myflix.network.Title

/** A wrapping grid of poster tiles, used by Search/My List/Family Videos/Coming Soon. */
@Composable
fun PosterGrid(titles: List<Title>, onTitleClick: (String) -> Unit, modifier: Modifier = Modifier) {
    LazyVerticalGrid(columns = GridCells.Adaptive(minSize = 220.dp), modifier = modifier) {
        items(titles) { title ->
            PosterCard(name = title.name, posterUrl = title.posterUrl, badge = title.status, onClick = { onTitleClick(title.id) })
        }
    }
}
