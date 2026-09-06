package com.tylerbailly.myflix.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.Title
import com.tylerbailly.myflix.ui.common.PosterGrid
import com.tylerbailly.myflix.ui.common.TopNavBar
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class SearchViewModel : ViewModel() {
    private val _results = MutableStateFlow<List<Title>>(emptyList())
    val results: StateFlow<List<Title>> = _results
    private var searchJob: Job? = null

    fun search(query: String) {
        searchJob?.cancel()
        if (query.isBlank()) {
            _results.value = emptyList()
            return
        }
        searchJob = viewModelScope.launch {
            delay(400) // debounce so we don't fire a request per keystroke
            try {
                _results.value = ApiClient.apiService.search(query)
            } catch (e: Exception) {
                _results.value = emptyList()
            }
        }
    }
}

@Composable
fun SearchScreen(
    onTitleClick: (String) -> Unit,
    onHome: () -> Unit,
    onFamilyVideos: () -> Unit,
    onMyList: () -> Unit,
    onComingSoon: () -> Unit,
    viewModel: SearchViewModel = viewModel()
) {
    var query by remember { mutableStateOf("") }
    val results by viewModel.results.collectAsState()

    LaunchedEffect(query) { viewModel.search(query) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TopNavBar(onHome = onHome, onFamilyVideos = onFamilyVideos, onMyList = onMyList, onSearch = {}, onComingSoon = onComingSoon)

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search titles") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)
        )

        if (results.isEmpty() && query.isNotBlank()) {
            Text("No results for \"$query\"", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(24.dp))
        }

        PosterGrid(titles = results, onTitleClick = onTitleClick, modifier = Modifier.padding(top = 16.dp))
    }
}
