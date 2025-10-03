//
//  PostalCodeEditView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 10/01/2025.
//

import Factory
import SwiftUI

struct PostalCodeEditView: View {
    @Environment(\.dismiss) var dismiss
    @Injected(\.supabaseService) var supabase
    @State var postalCodes: [PostalCode] = []
    @State var postalCodesDisabledToDelete: [PostalCode] = []
    @State var showingAddAlert = false
    @State var newPostalCodeText = ""

    var body: some View {
        NavigationStack {
            List {
                ForEach(postalCodes) { postalCode in
                    Text(postalCode.no)
                        .deleteDisabled(postalCodesDisabledToDelete.contains(postalCode))
                }
                .onDelete(perform: delete)
            }
            .navigationTitle("Edycja kodów pocztowych")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                EditButton()
                Button("Dodaj", systemImage: "plus") {
                    showingAddAlert = true
                }
            }
        }
        .alert("Nowy kod pocztowy", isPresented: $showingAddAlert) {
            TextField("Kod pocztowy", text: $newPostalCodeText)

            Button("Anuluj", role: .cancel) { }

            Button("Dodaj") {
                Task {
                    await add()
                    newPostalCodeText = ""
                }
            }
        }
        .task {
            await fetchData()
        }
    }
}

extension PostalCodeEditView {
    func fetchData() async {
        do {
            postalCodes = try await supabase.client
                .from(PostalCode.tableName)
                .select()
                .execute()
                .value

            postalCodesDisabledToDelete = try await supabase.client
                .rpc("get_undelivered_postal_codes")
                .execute()
                .value
        } catch {
            print("Error fetching postal codes: \(error)")
            dismiss()
        }
    }

    func add() async {
        guard !postalCodes.map(\.no).contains(newPostalCodeText) else { return }

        do {
            try await supabase.client
                .from(PostalCode.tableName)
                .insert(PostalCode.Create(no: newPostalCodeText))
                .execute()

            await fetchData()
        } catch {
            print("Error adding new postal code: \(error)")
        }
    }

    func delete(at offsets: IndexSet) {
        for index in offsets {
            let postalCode = postalCodes[index]
            Task {
                do {
                    try await supabase.client
                        .from(PostalCode.tableName)
                        .delete()
                        .eq("id", value: postalCode.id)
                        .execute()

                    await fetchData()
                } catch {
                    print("Error adding new postal code: \(error)")
                }
            }
        }
    }
}

#Preview {
    PostalCodeEditView()
}
