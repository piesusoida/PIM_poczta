//
//  ManagerView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct ManagerView: View {
    @Injected(\.supabaseService) var supabase

    @State var users: [User] = []
    @State var searchText = ""
    @State var pickupPointEditViewActive = false
    @State var postalCodeSelectionViewActive = false
    @State var selectedUser: User?
    @State var permissions: [User.ID: UserDetailsCard.Permission] = [:]

    var filteredUsers: [User] {
        if searchText.isEmpty { return users }
        return users.filter {
            $0.email.localizedStandardContains(searchText) ||
            $0.name.localizedStandardContains(searchText) ||
            $0.surname.localizedStandardContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            if users.isEmpty {
                ProgressView()
            } else {
                List(filteredUsers) { user in
                    UserDetailsCard(user: user, permission: permissions[user.id] ?? .regular) { user, permission in
                        selectedUser = user

                        switch permission {
                        case .courier:
                            postalCodeSelectionViewActive = true
                        case .pickupPoint:
                            pickupPointEditViewActive = true
                        case .regular, .manager:
                            break
                        }
                    }
                }
                .searchable(text: $searchText)
                .navigationDestination(isPresented: $pickupPointEditViewActive) {
                    if let selectedUser {
                        PickupPointEditView(userID: selectedUser.id)
                    } else {
                        EmptyView()
                    }
                }
                .navigationDestination(isPresented: $postalCodeSelectionViewActive) {
                    if let selectedUser {
                        PostalCodeSelectionView(userID: selectedUser.id)
                    } else {
                        EmptyView()
                    }
                }
                .toolbar {
                    NavigationLink {
                        PostalCodeEditView()
                    } label: {
                        Label("Edytuj kody pocztowe", systemImage: "mappin.and.ellipse")
                    }
                }
                .navigationTitle("Uprawnienia")
            }
        }
        .task {
            await fetchUsers()
        }
    }
}

extension ManagerView {
    func fetchUsers() async {
        do {
            let users: [User] = try await supabase.client
                .from(User.tableName)
                .select()
                .execute()
                .value

            for user in users {
                let userController = UserController(user: user)
                await userController.fetchPermissions()

                let permission: UserDetailsCard.Permission
                if userController.isManager {
                    permission = .manager
                } else if userController.isCourier {
                    permission = .courier
                } else if userController.isPickupPoint {
                    permission = .pickupPoint
                } else {
                    permission = .regular
                }

                permissions[user.id] = permission
            }

            self.users = users
        } catch {
            print("Error fetching users: \(error)")
        }
    }
}

#Preview {
    ManagerView()
}
