package com.tylerbailly.myflix.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.HomeResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {
    private val _home = MutableStateFlow<HomeResponse?>(null)
    val home: StateFlow<HomeResponse?> = _home

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun load() {
        viewModelScope.launch {
            try {
                _home.value = ApiClient.apiService.home()
            } catch (e: Exception) {
                _error.value = "Couldn't load your home screen. Check your connection."
            }
        }
    }
}
