package com.tylerbailly.myflix.ui.comingsoon

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.ComingSoonResponse
import com.tylerbailly.myflix.ui.common.PosterGrid
import com.tylerbailly.myflix.ui.common.TopNavBar
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ComingSoonViewModel : ViewModel() {
    private val _data = MutableStateFlow<ComingSoonResponse?>(null)
    val data: StateFlow<ComingSoonResponse?> = _data

    fun load() {
        viewModelScope.launch {
            try {
                _data.value = ApiClient.apiService.comingSoon()
            } catch (e: Exception) {
                // leave data null
            }
        }
    }
}

@Composable
fun ComingSoonScreen(
    onTitleClick: (String) -> Unit,
    onHome: () -> Unit,
    onFamilyVideos: () -> Unit,
    onMyList: () -> Unit,
    onSearch: () -> Unit,
    viewModel: ComingSoonViewModel = viewModel()
) {
    val data by viewModel.data.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TopNavBar(onHome = onHome, onFamilyVideos = onFamilyVideos, onMyList = onMyList, onSearch = onSearch, onComingSoon = {})
        Text("Coming Soon", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(24.dp))

        val d = data
        if (d != null) {
            Text("Upcoming Releases", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(horizontal = 24.dp))
            PosterGrid(titles = d.upcoming, onTitleClick = onTitleClick)

            if (d.rereleases.isNotEmpty()) {
                Text("Re-Releases", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp))
                PosterGrid(titles = d.rereleases, onTitleClick = onTitleClick)
            }
        }
    }
}
