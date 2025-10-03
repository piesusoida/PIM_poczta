//
//  AuthView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct AuthView: View {
    @Injected(\.supabaseService) var supabaseService
    @Injected(\.userController) var userController
    @State var isAuthenticated = false

    var body: some View {
        Group {
            if isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .task {
            for await state in supabaseService.client.auth.authStateChanges {
                if [.initialSession, .signedIn, .signedOut].contains(state.event) {
                    let isAuthenticated = state.session != nil
                    if isAuthenticated {
                        await userController.fetch()
                    }
                    withAnimation {
                        self.isAuthenticated = isAuthenticated
                    }
                }
            }
        }
    }
}

#Preview {
    AuthView()
}
