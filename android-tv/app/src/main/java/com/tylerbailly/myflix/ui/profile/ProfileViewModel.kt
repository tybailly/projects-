package com.tylerbailly.myflix.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tylerbailly.myflix.network.ApiClient
import com.tylerbailly.myflix.network.CreateProfileRequest
import com.tylerbailly.myflix.network.Genre
import com.tylerbailly.myflix.network.GenreIdsRequest
import com.tylerbailly.myflix.network.Profile
import com.tylerbailly.myflix.network.SelectProfileRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ProfileViewModel : ViewModel() {
    private val _profiles = MutableStateFlow<List<Profile>?>(null)
    val profiles: StateFlow<List<Profile>?> = _profiles

    private val _genres = MutableStateFlow<List<Genre>?>(null)
    val genres: StateFlow<List<Genre>?> = _genres

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun loadProfiles() {
        viewModelScope.launch {
            try {
                _profiles.value = ApiClient.apiService.profiles()
            } catch (e: Exception) {
                _error.value = "Couldn't load profiles."
            }
        }
    }

    fun loadGenres() {
        viewModelScope.launch {
            try {
                _genres.value = ApiClient.apiService.genres()
            } catch (e: Exception) {
                _error.value = "Couldn't load genres."
            }
        }
    }

    fun selectProfile(profileId: String, onDone: () -> Unit) {
        viewModelScope.launch {
            try {
                ApiClient.apiService.selectProfile(SelectProfileRequest(profileId))
                onDone()
            } catch (e: Exception) {
                _error.value = "Couldn't select that profile."
            }
        }
    }

    fun createProfile(name: String, isKids: Boolean, onCreated: (Profile) -> Unit) {
        viewModelScope.launch {
            try {
                val profile = ApiClient.apiService.createProfile(CreateProfileRequest(name, isKids))
                onCreated(profile)
            } catch (e: Exception) {
                _error.value = "Couldn't create that profile."
            }
        }
    }

    fun saveGenresAndSelect(profileId: String, genreIds: List<String>, onDone: () -> Unit) {
        viewModelScope.launch {
            try {
                ApiClient.apiService.setProfileGenres(profileId, GenreIdsRequest(genreIds))
                ApiClient.apiService.selectProfile(SelectProfileRequest(profileId))
                onDone()
            } catch (e: Exception) {
                _error.value = "Couldn't save your genre picks."
            }
        }
    }
}
