//
//  BazyProjektApp+Injected.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import Foundation

extension Container {
    var supabaseService: Factory<SupabaseService> {
        self { SupabaseService() }
            .singleton
    }

    var userController: Factory<UserController> {
        self { UserController() }
            .singleton
    }
}
