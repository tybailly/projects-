package com.tylerbailly.myflix.ui.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.ProgressRequest
import com.tylerbailly.myflix.network.WatchResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class PlayerViewModel : ViewModel() {
    private val _watch = MutableStateFlow<WatchResponse?>(null)
    val watch: StateFlow<WatchResponse?> = _watch

    fun load(id: String) {
        viewModelScope.launch {
            _watch.value = ApiClient.apiService.watch(id)
        }
    }

    fun reportProgress(id: String, positionSeconds: Int, durationSeconds: Int?) {
        viewModelScope.launch {
            try {
                ApiClient.apiService.reportProgress(ProgressRequest(id, positionSeconds, durationSeconds))
            } catch (e: Exception) {
                // Resume tracking is best-effort; a dropped progress update
                // shouldn't interrupt playback.
            }
        }
    }
}
