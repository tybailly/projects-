package com.tylerbailly.myflix

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tylerbailly.myflix.ui.home.PlaceholderHomeScreen
import com.tylerbailly.myflix.ui.login.LoginScreen
import com.tylerbailly.myflix.ui.login.RegisterScreen
import com.tylerbailly.myflix.ui.profile.CreateProfileScreen
import com.tylerbailly.myflix.ui.profile.GenrePickerScreen
import com.tylerbailly.myflix.ui.profile.ProfilePickerScreen
import com.tylerbailly.myflix.ui.theme.MyFlixTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyFlixTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = "login") {
                    composable("login") {
                        LoginScreen(
                            onLoginSuccess = {
                                navController.navigate("profiles") {
                                    popUpTo("login") { inclusive = true }
                                }
                            },
                            onNavigateToRegister = { navController.navigate("register") }
                        )
                    }
                    composable("register") {
                        RegisterScreen(
                            onRegisterSuccess = {
                                navController.navigate("profiles") {
                                    popUpTo("login") { inclusive = true }
                                }
                            },
                            onNavigateToLogin = { navController.popBackStack() }
                        )
                    }
                    composable("profiles") {
                        ProfilePickerScreen(
                            onProfileSelected = {
                                navController.navigate("home") {
                                    popUpTo("profiles") { inclusive = true }
                                }
                            },
                            onAddProfile = { navController.navigate("createProfile") }
                        )
                    }
                    composable("createProfile") {
                        CreateProfileScreen(
                            onCreated = { profile ->
                                navController.navigate("genres/${profile.id}") {
                                    popUpTo("profiles")
                                }
                            }
                        )
                    }
                    composable(
                        "genres/{profileId}",
                        arguments = listOf(navArgument("profileId") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val profileId = backStackEntry.arguments?.getString("profileId") ?: return@composable
                        GenrePickerScreen(
                            profileId = profileId,
                            onDone = {
                                navController.navigate("home") {
                                    popUpTo("profiles") { inclusive = true }
                                }
                            }
                        )
                    }
                    composable("home") {
                        PlaceholderHomeScreen()
                    }
                }
            }
        }
    }
}
