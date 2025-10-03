//
//  AddPackageView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct AddPackageView: View {
    @Environment(\.dismiss) var dismiss
    @Injected(\.supabaseService) var supabase

    let didAddPackage: () -> Void

    @State var senderID = 0

    @State var senderFirstName = ""
    @State var senderLastName = ""
    @State var senderPhoneNumber = ""
    @State var senderEmail = ""

    @State var receiverFirstName = ""
    @State var receiverLastName = ""
    @State var receiverPhoneNumber = ""
    @State var receiverEmail = ""

    @State var availablePostalCodes: [PostalCode] = []
    @State var postalCode: PostalCode?
    @State var streetName = ""
    @State var streetNo = ""
    @State var apartmentNo = ""

    @State var weight = ""
    @State var sizeX = ""
    @State var sizeY = ""
    @State var sizeZ = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Nadawca") {
                    TextField("Imię", text: $senderFirstName)
                    TextField("Nazwisko", text: $senderLastName)
                    TextField("Telefon", text: $senderPhoneNumber)
                    TextField("Email", text: $senderEmail)
                }
                .disabled(true)
                .foregroundStyle(.secondary)

                Section("Odbiorca") {
                    TextField("Imię", text: $receiverFirstName)

                    TextField("Nazwisko", text: $receiverLastName)

                    TextField("Telefon", text: $receiverPhoneNumber)
                        .keyboardType(.phonePad)

                    TextField("Email", text: $receiverEmail)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section("Dostawa") {
                    Picker("Kod pocztowy", selection: $postalCode) {
                        Text("Wybierz").tag(nil as PostalCode?)

                        ForEach(availablePostalCodes) {
                            Text($0.no)
                                .tag($0)
                        }
                    }

                    TextField("Ulica", text: $streetName)

                    HStack {
                        TextField("Nr budynku", text: $streetNo)
                            .keyboardType(.numberPad)

                        TextField("Nr lokalu", text: $apartmentNo)
                            .keyboardType(.numberPad)
                    }
                }

                Section("Szczegóły przesyłki") {
                    TextField("Waga (kg)", text: $weight)

                    HStack {
                        TextField("Długość (cm)", text: $sizeX)
                        TextField("Szerokość (cm)", text: $sizeY)
                        TextField("Głębokość (cm)", text: $sizeZ)
                    }
                }
                .keyboardType(.decimalPad)
            }
            .navigationTitle("Nadaj paczkę")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Anuluj") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Nadaj") {
                        Task {
                            let success = await sentPackage()
                            if success {
                                didAddPackage()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!isValid)
                }
            }
        }
        .interactiveDismissDisabled()
        .task {
            await fetchData()
        }
    }
}

extension AddPackageView {
    var isValid: Bool {
        let user = Container.shared.userController().currentUser
        guard receiverEmail != user?.email, receiverPhoneNumber != user?.phoneNo else {
            return false
        }

        guard receiverFirstName.isNotEmpty, receiverLastName.isNotEmpty, receiverEmail.isNotEmpty, receiverPhoneNumber.isNotEmpty else {
            return false
        }

        guard postalCode != nil, streetName.isNotEmpty, streetNo.isNotEmpty else {
            return false
        }

        guard weight.isNotEmpty, sizeX.isNotEmpty, sizeY.isNotEmpty, sizeZ.isNotEmpty else {
            return false
        }

        return true
    }

    func fetchData() async {
        guard let user = Container.shared.userController().currentUser else {
            dismiss()
            return
        }
        do {
            senderFirstName = user.name
            senderLastName = user.surname
            senderPhoneNumber = user.phoneNo
            senderEmail = user.email
            senderID = user.id

            // Postal Codes
            availablePostalCodes = try await supabase.client
                .from(PostalCode.tableName)
                .select()
                .execute()
                .value
        } catch {
            print("Error fetching data: \(error)")
            dismiss()
        }
    }

    func sentPackage() async -> Bool {
        guard let postalCode else { return false }
        do {
            let courierID: Int = try await supabase.client.rpc(
                "get_courier_id",
                params: ["postal_code_id": postalCode.id]
            ).execute().value

            let receiverID: Int? = try await supabase.client.rpc(
                "get_receiver_id",
                params: [
                    "email": receiverEmail,
                    "phone_number": receiverPhoneNumber
                ]
            ).execute().value

            let size = Double(sizeX.replacing(",", with: "."))! * Double(sizeY.replacing(",", with: "."))! * Double(sizeZ.replacing(",", with: "."))!
            let package = Package.Create(
                receiverID: receiverID,
                postalCodeID: postalCode.id,
                street: streetName,
                streetNo: Int(streetNo)!,
                apartmentNo: apartmentNo.isEmpty ? nil : Int(apartmentNo),
                weight: Double(weight.replacing(",", with: "."))!,
                size: size,
                senderID: senderID,
                pickupCode: Package.Create.generatePickupCode(),
                courierID: courierID,
                receiverEmail: receiverEmail,
                receiverPhoneNo: receiverPhoneNumber
            )

            let _ = try await supabase.client
                .from(Package.tableName)
                .insert(package)
                .execute()

            return true
        } catch {
            print("Error sending package: \(error)")
            return false
        }
    }
}

#Preview {
    AddPackageView() { }
}
