package com.tylerbailly.myflix.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.tylerbailly.myflix.network.ProviderDetailResponse
import com.tylerbailly.myflix.ui.common.PosterCard
import com.tylerbailly.myflix.ui.theme.BrandRed
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ProviderViewModel : ViewModel() {
    private val _detail = MutableStateFlow<ProviderDetailResponse?>(null)
    val detail: StateFlow<ProviderDetailResponse?> = _detail
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun load(slug: String) {
        viewModelScope.launch {
            try {
                _detail.value = ApiClient.apiService.provider(slug)
            } catch (e: Exception) {
                _error.value = "Couldn't load this service's catalog."
            }
        }
    }
}

@Composable
fun ProviderScreen(slug: String, onTitleClick: (String) -> Unit, viewModel: ProviderViewModel = viewModel()) {
    val detail by viewModel.detail.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(slug) { viewModel.load(slug) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        val d = detail
        if (error != null) {
            Text(error!!, color = BrandRed, modifier = Modifier.padding(24.dp))
        } else if (d == null) {
            Text("Loading...", color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(24.dp))
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                item {
                    Text(
                        d.provider.name,
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.padding(24.dp)
                    )
                }
                items(d.genres) { genre ->
                    Column {
                        Text(
                            genre.name,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onBackground,
                            modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
                        )
                        LazyRow(contentPadding = PaddingValues(horizontal = 18.dp)) {
                            items(genre.titles) { title ->
                                PosterCard(name = title.name, posterUrl = title.posterUrl, onClick = { onTitleClick(title.id) })
                            }
                        }
                    }
                }
            }
        }
    }
}
