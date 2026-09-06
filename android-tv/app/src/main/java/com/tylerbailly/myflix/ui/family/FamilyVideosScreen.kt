package com.tylerbailly.myflix.ui.family

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
import com.tylerbailly.myflix.network.FamilyVideosResponse
import com.tylerbailly.myflix.ui.common.PosterGrid
import com.tylerbailly.myflix.ui.common.TopNavBar
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class FamilyVideosViewModel : ViewModel() {
    private val _data = MutableStateFlow<FamilyVideosResponse?>(null)
    val data: StateFlow<FamilyVideosResponse?> = _data

    fun load() {
        viewModelScope.launch {
            try {
                _data.value = ApiClient.apiService.familyVideos()
            } catch (e: Exception) {
                // leave data null; screen shows nothing rather than crashing
            }
        }
    }
}

@Composable
fun FamilyVideosScreen(
    onTitleClick: (String) -> Unit,
    onHome: () -> Unit,
    onMyList: () -> Unit,
    onSearch: () -> Unit,
    onComingSoon: () -> Unit,
    viewModel: FamilyVideosViewModel = viewModel()
) {
    val data by viewModel.data.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TopNavBar(onHome = onHome, onFamilyVideos = {}, onMyList = onMyList, onSearch = onSearch, onComingSoon = onComingSoon)
        Text("Family Videos", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(24.dp))

        val d = data
        if (d != null) {
            if (d.continueWatching.isNotEmpty()) {
                Text("Continue Watching", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(horizontal = 24.dp))
                PosterGrid(titles = d.continueWatching, onTitleClick = onTitleClick)
            }
            Text("All Family Videos", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp))
            if (d.videos.isEmpty()) {
                Text("No family videos yet. Upload one from the web app.", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(horizontal = 24.dp))
            }
            PosterGrid(titles = d.videos, onTitleClick = onTitleClick)
        }
    }
}
