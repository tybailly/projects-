package com.tylerbailly.myflix

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tylerbailly.myflix.ui.home.HomeScreen
import com.tylerbailly.myflix.ui.home.ProviderScreen
import com.tylerbailly.myflix.ui.login.LoginScreen
import com.tylerbailly.myflix.ui.login.RegisterScreen
import com.tylerbailly.myflix.ui.player.PlayerScreen
import com.tylerbailly.myflix.ui.profile.CreateProfileScreen
import com.tylerbailly.myflix.ui.profile.GenrePickerScreen
import com.tylerbailly.myflix.ui.profile.ProfilePickerScreen
import com.tylerbailly.myflix.ui.theme.MyFlixTheme
import com.tylerbailly.myflix.ui.title.TitleDetailScreen

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
                        HomeScreen(
                            onTitleClick = { id -> navController.navigate("title/$id") },
                            onProviderClick = { slug -> navController.navigate("provider/$slug") }
                        )
                    }
                    composable(
                        "title/{id}",
                        arguments = listOf(navArgument("id") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val id = backStackEntry.arguments?.getString("id") ?: return@composable
                        TitleDetailScreen(
                            titleId = id,
                            onPlayUpload = { titleId -> navController.navigate("player/$titleId") }
                        )
                    }
                    composable(
                        "player/{id}",
                        arguments = listOf(navArgument("id") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val id = backStackEntry.arguments?.getString("id") ?: return@composable
                        PlayerScreen(titleId = id)
                    }
                    composable(
                        "provider/{slug}",
                        arguments = listOf(navArgument("slug") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val slug = backStackEntry.arguments?.getString("slug") ?: return@composable
                        ProviderScreen(
                            slug = slug,
                            onTitleClick = { id -> navController.navigate("title/$id") }
                        )
                    }
                }
            }
        }
    }
}
