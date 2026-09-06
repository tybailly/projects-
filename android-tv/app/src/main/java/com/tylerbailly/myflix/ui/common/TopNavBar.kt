package com.tylerbailly.myflix.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tylerbailly.myflix.ui.theme.FocusColor

/** A simple top-level nav row, matching the web app's Home / Family Videos / My List / Search bar. */
@Composable
fun TopNavBar(
    onHome: () -> Unit,
    onFamilyVideos: () -> Unit,
    onMyList: () -> Unit,
    onSearch: () -> Unit,
    onComingSoon: () -> Unit
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(24.dp),
        modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp)
    ) {
        NavItem("Home", onHome)
        NavItem("Family Videos", onFamilyVideos)
        NavItem("Coming Soon", onComingSoon)
        NavItem("My List", onMyList)
        NavItem("Search", onSearch)
    }
}

@Composable
private fun NavItem(label: String, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Text(
        label,
        color = if (isFocused) FocusColor else MaterialTheme.colorScheme.onBackground,
        modifier = Modifier
            .border(width = if (isFocused) 1.dp else 0.dp, color = FocusColor)
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick)
            .padding(4.dp)
    )
}
