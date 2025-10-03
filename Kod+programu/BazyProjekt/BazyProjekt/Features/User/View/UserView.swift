//
//  UserView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct UserView: View {
    @Injected(\.supabaseService) var supabaseService
    @Injected(\.userController) var userController

    @State var pickupPointID = ""

    var body: some View {
        NavigationStack {
            Form {
                if userController.isPickupPoint {
                    Section("Identyfikator") {
                        Text(pickupPointID)
                    }
                }

                Section("Imię i nazwisko") {
                    Text(userController.currentUser.name + " " + userController.currentUser.surname)
                }

                Section("Numer telefonu") {
                    Text(userController.currentUser.phoneNo)
                }

                Section("Email") {
                    Text(userController.currentUser.email)
                }
            }
            .toolbar {
                Button("Wyloguj się", systemImage: "rectangle.portrait.and.arrow.right") {
                    Task {
                        try? await supabaseService.client.auth.signOut()
                    }
                }
            }
            .navigationTitle("Twoje dane")
        }
        .task {
            await fetchData()
        }
    }
}

extension UserView {
    func fetchData() async {
        do {
            let pickupPoint: PickupPoint = try await supabaseService.client
                .from(PickupPoint.tableName)
                .select("""
                    *,
                    uzytkownik:uzytkownicy(*),
                    kod_pocztowy:kody_pocztowe(*)
                """)
                .eq("id_uzytkownika", value: userController.currentUser.id)
                .single()
                .execute()
                .value

            pickupPointID = String(pickupPoint.id)
        } catch {
            print("Error fetching data: \(error)")
        }
    }
}

#Preview {
    UserView()
}
