package com.tylerbailly.myflix.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tylerbailly.myflix.ui.theme.BrandRed
import com.tylerbailly.myflix.ui.theme.SurfaceDark

/** A focusable poster tile used in every horizontally-scrolling row. */
@Composable
fun PosterCard(
    name: String,
    posterUrl: String?,
    badge: String? = null,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Column(
        modifier = Modifier
            .width(140.dp)
            .padding(6.dp)
    ) {
        Box(
            modifier = Modifier
                .width(140.dp)
                .height(200.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(SurfaceDark)
                .border(
                    width = if (isFocused) 3.dp else 0.dp,
                    color = BrandRed,
                    shape = RoundedCornerShape(4.dp)
                )
                .clickable(interactionSource = interactionSource, indication = null, onClick = onClick)
        ) {
            if (posterUrl != null) {
                AsyncImage(
                    model = posterUrl,
                    contentDescription = name,
                    modifier = Modifier.height(200.dp).width(140.dp)
                )
            } else {
                Text(
                    name,
                    modifier = Modifier.align(Alignment.Center).padding(4.dp),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (badge != null) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .background(BrandRed)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(badge, color = MaterialTheme.colorScheme.onPrimary, style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}
