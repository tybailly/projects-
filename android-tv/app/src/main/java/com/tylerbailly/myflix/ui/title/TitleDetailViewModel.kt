package com.tylerbailly.myflix.ui.title

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.TitleDetail
import com.tylerbailly.myflix.network.TitleIdRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class TitleDetailViewModel : ViewModel() {
    private val _title = MutableStateFlow<TitleDetail?>(null)
    val title: StateFlow<TitleDetail?> = _title

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun load(id: String) {
        viewModelScope.launch {
            try {
                _title.value = ApiClient.apiService.title(id)
            } catch (e: Exception) {
                _error.value = "Couldn't load this title."
            }
        }
    }

    fun toggleWatchlist(id: String) {
        val current = _title.value ?: return
        viewModelScope.launch {
            try {
                if (current.inWatchlist) {
                    ApiClient.apiService.removeFromWatchlist(TitleIdRequest(id))
                } else {
                    ApiClient.apiService.addToWatchlist(TitleIdRequest(id))
                }
                _title.value = current.copy(inWatchlist = !current.inWatchlist)
            } catch (e: Exception) {
                _error.value = "Couldn't update your watchlist."
            }
        }
    }
}
