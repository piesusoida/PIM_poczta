//
//  UserDetailsCard.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 10/01/2025.
//

import Factory
import SwiftUI

struct UserDetailsCard: View {
    enum Permission: String, CaseIterable {
        case regular = "Standardowy"
        case courier = "Kurier"
        case manager = "Kierownik"
        case pickupPoint = "Punkt odbioru"
    }

    @Injected(\.supabaseService) var supabase
    @Injected(\.userController) var userController

    let user: User
    let onTap: (User, Permission) -> Void
    @State var permission: Permission

    @State var isLoading = false

    init(user: User, permission: Permission, onTap: @escaping (User, Permission) -> Void) {
        self.user = user
        self._permission = State(initialValue: permission)
        self.onTap = onTap
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("\(user.name) \(user.surname)")

                Text(user.email).bold()
            }
            .font(.caption)
            .contentShape(.rect)
            .onTapGesture {
                onTap(user, permission)                
            }

            Spacer()

            if isLoading {
                ProgressView()
            } else {
                Picker("", selection: $permission) {
                    ForEach(Permission.allCases, id: \.self) {
                        Text($0.rawValue)
                    }
                }
                .disabled(userController.currentUser.id == user.id)
            }
        }
        .onChange(of: permission) {
            Task {
                await handlePermissionChange(to: permission)
            }
        }
    }
}

extension UserDetailsCard {
    func handlePermissionChange(to newPermission: Permission) async {
        isLoading = true
        defer { isLoading = false }

        await removePermissions()

        switch permission {
        case .regular:
            break
        case .courier:
            await addCourierPermission()
        case .manager:
            await addManagerPermission()
        case .pickupPoint:
            await addPickupPointPermission()
        }
    }

    func removePermissions() async {
        do {
            try await supabase.client
                .from(Manager.tableName)
                .delete()
                .eq("id_uzytkownika", value: user.id)
                .execute()

            try await supabase.client
                .from(Courier.tableName)
                .delete()
                .eq("id_uzytkownika", value: user.id)
                .execute()

            try await supabase.client
                .from(PickupPoint.tableName)
                .delete()
                .eq("id_uzytkownika", value: user.id)
                .execute()

            try await supabase.client.rpc("couriers_to_packages").execute()
        } catch {
        }
    }

    func addManagerPermission() async {
        do {
            try await supabase.client
                .from(Manager.tableName)
                .insert(Manager.Create(id_uzytkownika: user.id))
                .execute()
        } catch {
        }
    }

    func addCourierPermission() async {
        do {
            try await supabase.client
                .from(Courier.tableName)
                .insert(Courier.Create(id_uzytkownika: user.id))
                .execute()
        } catch {
        }
    }

    func addPickupPointPermission() async {
        do {
            let firstPostalCode: PostalCode = try await supabase.client
                .from(PostalCode.tableName)
                .select()
                .limit(1)
                .single()
                .execute()
                .value

            let pickupPoint = PickupPoint.Create(
                name: "",
                userID: user.id,
                postalCodeID: firstPostalCode.id,
                street: "",
                streetNo: 0,
                apartmentNo: nil
            )
            try await supabase.client
                .from(PickupPoint.tableName)
                .insert(pickupPoint)
                .execute()
        } catch {
        }
    }
}

#Preview {
    UserDetailsCard(user: .example, permission: .regular) { user, permission in }
}
