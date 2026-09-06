package com.tylerbailly.myflix.network

data class Title(
    val id: String,
    val name: String,
    val posterUrl: String?,
    val status: String? = null
)

data class PlayAction(
    val href: String,
    val label: String,
    val external: Boolean
)

data class HeroTitle(
    val id: String,
    val name: String,
    val description: String?,
    val backdropUrl: String?,
    val play: PlayAction
)

data class Provider(
    val id: String,
    val name: String,
    val slug: String,
    val brandColor: String
)

data class GenreRow(
    val id: String,
    val name: String,
    val titles: List<Title>
)

data class HomeResponse(
    val hero: HeroTitle?,
    val providers: List<Provider>,
    val comingSoon: List<Title>,
    val preferredGenreTitles: List<Title>,
    val recommendations: List<Title>,
    val genres: List<GenreRow>
)

data class ComingSoonResponse(
    val upcoming: List<Title>,
    val rereleases: List<Title>
)

data class FamilyVideosResponse(
    val continueWatching: List<Title>,
    val videos: List<Title>
)

data class ProviderDetailResponse(
    val provider: Provider,
    val genres: List<GenreRow>
)

data class WatchResponse(
    val source: String,
    val title: String,
    val manifestUrl: String?,
    val trailerKey: String?,
    val startPositionSeconds: Int?
)

data class TitleDetail(
    val id: String,
    val name: String,
    val description: String?,
    val releaseYear: Int?,
    val director: String?,
    val cast: String?,
    val maturityRating: String?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val status: String,
    val source: String,
    val provider: Provider?,
    val trailerKey: String?,
    val genreNames: List<String>,
    val inWatchlist: Boolean,
    val play: PlayAction?
)

data class Genre(
    val id: String,
    val name: String
)

data class Profile(
    val id: String,
    val userId: String,
    val name: String,
    val avatarUrl: String?,
    val isKids: Boolean
)

data class WatchlistEntry(
    val id: String,
    val titleId: String,
    val title: Title
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val inviteCode: String
)

data class RegisterResponse(
    val profileId: String?
)

data class CreateProfileRequest(
    val name: String,
    val isKids: Boolean = false
)

data class SelectProfileRequest(
    val profileId: String
)

data class TitleIdRequest(
    val titleId: String
)

data class GenreIdsRequest(
    val genreIds: List<String>
)

data class ProgressRequest(
    val titleId: String,
    val positionSeconds: Int,
    val durationSeconds: Int? = null
)

data class ApiError(
    val error: String?
)
