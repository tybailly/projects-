package com.tylerbailly.myflix

import android.app.Application
import com.tylerbailly.myflix.network.ApiClient

class MyFlixApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ApiClient.init(this)
    }
}
