package com.tylerbailly.myflix.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tylerbailly.myflix.network.Profile
import com.tylerbailly.myflix.ui.theme.BrandRed

@Composable
fun CreateProfileScreen(
    onCreated: (Profile) -> Unit,
    viewModel: ProfileViewModel = viewModel()
) {
    var name by remember { mutableStateOf("") }
    var isKids by remember { mutableStateOf(false) }
    val error by viewModel.error.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.width(400.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Add a Profile", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.onBackground)

            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                singleLine = true,
                modifier = Modifier.width(300.dp)
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Kids Profile", color = MaterialTheme.colorScheme.onBackground)
                Switch(checked = isKids, onCheckedChange = { isKids = it })
            }

            if (error != null) {
                Text(error!!, color = BrandRed)
            }

            Button(
                onClick = { if (name.isNotBlank()) viewModel.createProfile(name, isKids, onCreated) },
                modifier = Modifier.width(200.dp)
            ) {
                Text("Continue")
            }
        }
    }
}
