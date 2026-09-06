package com.tylerbailly.myflix.network

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @GET("api/home")
    suspend fun home(): HomeResponse

    @GET("api/coming-soon")
    suspend fun comingSoon(): ComingSoonResponse

    @GET("api/family-videos")
    suspend fun familyVideos(): FamilyVideosResponse

    @GET("api/providers/{slug}")
    suspend fun provider(@Path("slug") slug: String): ProviderDetailResponse

    @GET("api/watch/{id}")
    suspend fun watch(@Path("id") id: String): WatchResponse

    @GET("api/titles/{id}")
    suspend fun title(@Path("id") id: String): TitleDetail

    @GET("api/titles")
    suspend fun search(@Query("q") query: String): List<Title>

    @GET("api/genres")
    suspend fun genres(): List<Genre>

    @GET("api/profiles")
    suspend fun profiles(): List<Profile>

    @POST("api/profiles")
    suspend fun createProfile(@Body body: CreateProfileRequest): Profile

    @POST("api/profiles/select")
    suspend fun selectProfile(@Body body: SelectProfileRequest)

    @POST("api/profiles/{id}/genres")
    suspend fun setProfileGenres(@Path("id") profileId: String, @Body body: GenreIdsRequest)

    @GET("api/watchlist")
    suspend fun watchlist(): List<WatchlistEntry>

    @POST("api/watchlist")
    suspend fun addToWatchlist(@Body body: TitleIdRequest)

    @DELETE("api/watchlist")
    suspend fun removeFromWatchlist(@Body body: TitleIdRequest)

    @POST("api/progress")
    suspend fun reportProgress(@Body body: ProgressRequest)
}
