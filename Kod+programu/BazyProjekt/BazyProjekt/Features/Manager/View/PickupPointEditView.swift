//
//  PickupPointEditView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 10/01/2025.
//

import Factory
import SwiftUI

struct PickupPointEditView: View {
    @Environment(\.dismiss) var dismiss
    @Injected(\.supabaseService) var supabase
    let userID: Int

    @State var pickupPoint: PickupPoint?

    @State var name = ""
    @State var street = ""
    @State var streetNo = ""
    @State var apartmentNo = ""

    @State var availablePostalCodes: [PostalCode] = []
    @State var postalCode: PostalCode?    

    var changed: Bool {
        guard let pickupPoint, let postalCode else { return false }

        return pickupPoint.name != name ||
        pickupPoint.street != street ||
        String(pickupPoint.streetNo) != streetNo ||
        pickupPoint.apartmentNo != (Int(apartmentNo) ?? -1) ||
        pickupPoint.postalCode.id != postalCode.id
    }

    var body: some View {
        NavigationStack {
            Form {
                TextField("Nazwa", text: $name)

                Picker("Kod pocztowy", selection: $postalCode) {
                    Text("Wybierz").tag(nil as PostalCode?)

                    ForEach(availablePostalCodes) {
                        Text($0.no)
                            .tag($0)
                    }
                }

                TextField("Ulica", text: $street)

                TextField("Numer budynku", text: $streetNo)
                    .keyboardType(.numberPad)

                TextField("Numer lokalu", text: $apartmentNo)
                    .keyboardType(.numberPad)
            }
            .navigationTitle("Edycja punktu odbioru")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                Button("Aktualizuj") {
                    Task {
                        await update()
                        dismiss()
                    }
                }
                .disabled(!changed)
            }
        }
        .task {
            await fetchData()
        }
    }
}

extension PickupPointEditView {
    func fetchData() async {
        do {
            let pickupPoint: PickupPoint = try await supabase.client
                .from(PickupPoint.tableName)
                .select("""
                    *,
                    uzytkownik:uzytkownicy(*),
                    kod_pocztowy:kody_pocztowe(*)
                """)
                .eq("id_uzytkownika", value: userID)
                .single()
                .execute()
                .value
            self.pickupPoint = pickupPoint

            availablePostalCodes = try await supabase.client
                .from(PostalCode.tableName)
                .select()
                .execute()
                .value

            name = pickupPoint.name
            street = pickupPoint.street
            streetNo = String(pickupPoint.streetNo)
            if let apartmentNo = pickupPoint.apartmentNo {
                self.apartmentNo = String(apartmentNo)
            }
            postalCode = pickupPoint.postalCode
        } catch {
            print("Error fetching pickup point data: \(error)")
            dismiss()
        }
    }

    func update() async {
        guard let postalCode else { return }
        do {
            let updated = PickupPoint.Create(
                name: name,
                userID: userID,
                postalCodeID: postalCode.id,
                street: street,
                streetNo: Int(streetNo)!,
                apartmentNo: apartmentNo.isNotEmpty ? Int(apartmentNo)! : nil
            )
            try await supabase.client
                .from(PickupPoint.tableName)
                .update(updated)
                .eq("id_uzytkownika", value: userID)
                .execute()
        } catch {
            print("Error updating pickup point data: \(error)")
        }
    }
}

#Preview {
    PickupPointEditView(userID: 0)
}
