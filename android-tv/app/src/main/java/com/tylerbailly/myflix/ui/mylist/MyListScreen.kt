package com.tylerbailly.myflix.ui.mylist

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
import com.tylerbailly.myflix.network.Title
import com.tylerbailly.myflix.ui.common.PosterGrid
import com.tylerbailly.myflix.ui.common.TopNavBar
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MyListViewModel : ViewModel() {
    private val _titles = MutableStateFlow<List<Title>>(emptyList())
    val titles: StateFlow<List<Title>> = _titles

    fun load() {
        viewModelScope.launch {
            try {
                _titles.value = ApiClient.apiService.watchlist().map { it.title }
            } catch (e: Exception) {
                _titles.value = emptyList()
            }
        }
    }
}

@Composable
fun MyListScreen(
    onTitleClick: (String) -> Unit,
    onHome: () -> Unit,
    onFamilyVideos: () -> Unit,
    onSearch: () -> Unit,
    onComingSoon: () -> Unit,
    viewModel: MyListViewModel = viewModel()
) {
    val titles by viewModel.titles.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TopNavBar(onHome = onHome, onFamilyVideos = onFamilyVideos, onMyList = {}, onSearch = onSearch, onComingSoon = onComingSoon)
        Text("My List", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(24.dp))
        if (titles.isEmpty()) {
            Text("Nothing in your list yet.", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(horizontal = 24.dp))
        }
        PosterGrid(titles = titles, onTitleClick = onTitleClick)
    }
}
