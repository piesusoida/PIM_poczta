//
//  PostalCodeSelectionView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 10/01/2025.
//

import Factory
import SwiftUI

struct PostalCodeSelectionView: View {
    @Environment(\.dismiss) var dismiss

    @Injected(\.supabaseService) var supabase

    let userID: Int

    @State var courierID: Int?
    @State var postalCodes: [PostalCode] = []
    @State var selectedPostalCodes: [PostalCode] = []

    var body: some View {
        NavigationStack {
            List(postalCodes) { postalCode in
                HStack {
                    Text(postalCode.no)

                    Spacer()

                    if selectedPostalCodes.contains(postalCode) {
                        Image(systemName: "checkmark")
                            .tint(.blue)
                    }
                }
                .contentShape(.rect)
                .onTapGesture {
                    Task {
                        await handleTap(on: postalCode)
                    }
                }
            }            
        }
        .task {
            await fetchData()
        }
    }
}

extension PostalCodeSelectionView {
    func fetchData() async {
        do {
            postalCodes = try await supabase.client
                .from(PostalCode.tableName)
                .select()
                .execute()
                .value

            selectedPostalCodes = try await supabase.client.rpc(
                "get_couriers_postal_codes",
                params: ["user_id": userID]
            ).execute().value

            let courier: Courier = try await supabase.client
                .from(Courier.tableName)
                .select("""
                    *,
                    uzytkownik:uzytkownicy(*)
                """)
                .eq("id_uzytkownika", value: userID)
                .single()
                .execute()
                .value
            courierID = courier.id
        } catch {
            print("Error fetching data: \(error)")
            dismiss()
        }
    }

    func handleTap(on postalCode: PostalCode) async {
        if selectedPostalCodes.contains(postalCode) {
            await unselect(postalCode: postalCode)
        } else {
            await select(postalCode: postalCode)
        }
        await fetchData()
    }

    func unselect(postalCode: PostalCode) async {
        guard let courierID else { return }

        let _ = try? await supabase.client
            .from("join_kurierzy_kody_pocztowe")
            .delete()
            .eq("id_kuriera", value: courierID)
            .eq("id_kod_pocztowy", value: postalCode.id)
            .execute()
    }

    func select(postalCode: PostalCode) async {
        guard let courierID else { return }

        let _ = try? await supabase.client
            .from("join_kurierzy_kody_pocztowe")
            .insert([
                "id_kuriera": courierID,
                "id_kod_pocztowy": postalCode.id
            ])
            .execute()
    }
}

#Preview {
    PostalCodeSelectionView(userID: 0)
}
