package com.tylerbailly.myflix.network

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Field
import retrofit2.http.FormUrlEncoded
import retrofit2.http.GET
import retrofit2.http.POST

data class CsrfResponse(val csrfToken: String)

/**
 * NextAuth's Credentials sign-in isn't a plain JSON API -- it's the same
 * flow a browser goes through: fetch a CSRF token (which also sets a CSRF
 * cookie the callback checks against), then POST credentials as form data.
 * A successful callback sets the session cookie, which the persistent
 * cookie jar then attaches to every subsequent request automatically.
 */
interface AuthApi {
    @GET("api/auth/csrf")
    suspend fun csrf(): CsrfResponse

    @FormUrlEncoded
    @POST("api/auth/callback/credentials")
    suspend fun login(
        @Field("email") email: String,
        @Field("password") password: String,
        @Field("csrfToken") csrfToken: String,
        @Field("json") json: String = "true"
    ): Response<ResponseBody>

    @POST("api/register")
    suspend fun register(@Body body: RegisterRequest): Response<RegisterResponse>
}
