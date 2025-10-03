//
//  UserViewModel.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Factory
import Foundation

class UserController {
    @Injected(\.supabaseService) private var supabase

    private(set) var currentUser: User!
    private(set) var isCourier = false
    private(set) var isManager = false
    private(set) var isPickupPoint = false

    init() {}

    init(user: User) {
        self.currentUser = user
    }

    func fetch() async {
        do {
            let authID = try await supabase.client.auth.user().id
            currentUser = try await supabase.client
                .from(User.tableName)
                .select()
                .eq("auth_id", value: authID)
                .limit(1)
                .single()
                .execute()
                .value
            await fetchPermissions()
        } catch {
            fatalError("Could not load user: \(error)")
        }
    }

    func fetchPermissions() async {
        guard currentUser != nil else { return }
        do {
            let supabase = Container.shared.supabaseService().client

            // Courier
            let couriersCount = try await supabase
                .from(Courier.tableName)
                .select("*", head: true, count: .exact)
                .eq("id_uzytkownika", value: currentUser.id)
                .execute()
                .count
            isCourier = couriersCount == 1

            // Manager
            let managersCount = try await supabase
                .from(Manager.tableName)
                .select("*", head: true, count: .exact)
                .eq("id_uzytkownika", value: currentUser.id)
                .execute()
                .count
            isManager = managersCount == 1

            // Pickup Point
            let pickupPointCount = try await supabase
                .from(PickupPoint.tableName)
                .select("*", head: true, count: .exact)
                .eq("id_uzytkownika", value: currentUser.id)
                .execute()
                .count
            isPickupPoint = pickupPointCount == 1
        } catch {
            print("Error checking permissions: \(error)")
        }
    }
}
