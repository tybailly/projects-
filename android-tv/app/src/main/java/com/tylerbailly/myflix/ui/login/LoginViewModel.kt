package com.tylerbailly.myflix.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.RegisterRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed interface AuthUiState {
    data object Idle : AuthUiState
    data object Loading : AuthUiState
    data object Success : AuthUiState
    data class Error(val message: String) : AuthUiState
}

class LoginViewModel : ViewModel() {
    private val _state = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val state: StateFlow<AuthUiState> = _state

    fun login(email: String, password: String) {
        _state.value = AuthUiState.Loading
        viewModelScope.launch {
            try {
                val csrf = ApiClient.authApi.csrf()
                ApiClient.authApi.login(email = email, password = password, csrfToken = csrf.csrfToken)

                // The callback endpoint's response shape isn't a reliable
                // success/failure signal (NextAuth redirects either way), so
                // confirm the session actually took by calling an
                // authenticated endpoint.
                ApiClient.apiService.profiles()
                _state.value = AuthUiState.Success
            } catch (e: Exception) {
                _state.value = AuthUiState.Error("Invalid email or password.")
            }
        }
    }

    fun register(email: String, password: String, inviteCode: String) {
        _state.value = AuthUiState.Loading
        viewModelScope.launch {
            try {
                val response = ApiClient.authApi.register(RegisterRequest(email, password, inviteCode))
                if (!response.isSuccessful) {
                    _state.value = AuthUiState.Error("Registration failed. Check your invite code.")
                    return@launch
                }
                // Registration doesn't sign you in -- log in right after with
                // the same credentials to establish the session.
                login(email, password)
            } catch (e: Exception) {
                _state.value = AuthUiState.Error("Registration failed. Check your connection.")
            }
        }
    }

    fun resetState() {
        _state.value = AuthUiState.Idle
    }
}
