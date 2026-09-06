package com.tylerbailly.myflix.network

import android.content.Context
import android.content.SharedPreferences
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

/**
 * Stores cookies in SharedPreferences so the NextAuth session (an httpOnly
 * cookie, same as a browser gets) survives the app being closed and
 * reopened -- otherwise every launch would require logging in again.
 */
class PersistentCookieJar(context: Context) : CookieJar {
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("myflix_cookies", Context.MODE_PRIVATE)

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val existing = loadAll().toMutableMap()
        for (cookie in cookies) {
            val key = "${cookie.domain}|${cookie.name}"
            if (cookie.expiresAt < System.currentTimeMillis()) {
                existing.remove(key)
            } else {
                existing[key] = cookie.toString()
            }
        }
        prefs.edit().clear().apply {
            existing.forEach { (key, value) -> putString(key, value) }
        }.apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        return loadAll().values.mapNotNull { Cookie.parse(url, it) }
            .filter { it.matches(url) }
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    private fun loadAll(): Map<String, String> {
        return prefs.all.mapNotNull { (key, value) ->
            if (value is String) key to value else null
        }.toMap()
    }
}
