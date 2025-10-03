//
//  CourierView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct CourierView: View {
    @Injected(\.supabaseService) var supabase
    @Injected(\.userController) var userController

    @State var packagesToDeliver: [String: [Package]] = [:]

    @State var selectedPackageForDelivery: Package?
    @State var isAlertVisible = false
    @State var alertTitle = ""
    @State var textFieldHint = ""
    @State var pickupCode = ""

    @State var selectedPackageForPickupPoint: Package?
    @State var selectedPackageForPickupPointValidation: Package?
    @State var selectedPickupPoint: PickupPoint?

    var body: some View {
        NavigationStack {
            List {
                ForEach(Array(packagesToDeliver.keys).sorted(by: <), id: \.self) { postalCode in
                    Section(postalCode) {
                        ForEach(packagesToDeliver[postalCode]!.sorted(by: { $0.status < $1.status })) { package in
                            DeliverPackageCardView(package: package)
                                .swipeActions(allowsFullSwipe: package.packageStatus == .created) {
                                    if package.packageStatus == .created {
                                        Button("Odbierz") {
                                            update(package: package, status: .transport)
                                        }
                                        .tint(Package.Status.transport.color)
                                    } else if package.packageStatus == .transport {
                                        Button("Dostarcz") {
                                            selectedPackageForDelivery = package
                                            alertTitle = "Wpisz kod odbioru"
                                            textFieldHint = "Kod odbioru"
                                            isAlertVisible = true
                                        }
                                        .tint(Package.Status.received.color)

                                        Button("Punkt odbioru") {
                                            selectedPackageForPickupPointValidation = package
                                            selectedPackageForPickupPoint = package
                                        }
                                        .tint(Package.Status.pickupPoint.color)
                                    }
                                }
                        }
                    }
                }
            }
            .refreshable {
                Task {
                    await userController.fetch()
                    await fetchPackages()
                }
            }
            .navigationTitle("Do dostarczenia")
            .sheet(item: $selectedPackageForPickupPoint) { package in
                PickupPointSelectView(postalCodeNo: package.postalCode.no) { pickupPoint in
                    selectedPickupPoint = pickupPoint
                    alertTitle = "Wpisz identyfikator punktu"
                    textFieldHint = "Identyfikator punktu"
                    isAlertVisible = true
                }
                .presentationContentInteraction(.scrolls)
            }
            .alert(alertTitle, isPresented: $isAlertVisible) {
                TextField(textFieldHint, text: $pickupCode)

                Button("Anuluj", role: .cancel) { }
                Button("OK") {
                    if let selectedPackageForDelivery, validatePickupCode() {
                        update(package: selectedPackageForDelivery, status: .received)
                    }
                    if let selectedPackageForPickupPointValidation, validateId() {
                        update(package: selectedPackageForPickupPointValidation, status: .pickupPoint)
                    }
                    pickupCode = ""
                }
            }
        }
        .task {
            await fetchPackages()
        }
    }
}

extension CourierView {
    func fetchPackages() async {
        do {
            let response: [String: Int] = try await supabase.client
                .from(Courier.tableName)
                .select("id")
                .eq("id_uzytkownika", value: userController.currentUser.id)
                .single()
                .execute()
                .value
            guard let courierID = response["id"] else { return }

            let packages: [Package] = try await supabase.client
                .from(Package.tableName)
                .select("""
                    *,
                    punkt_odbioru:punkty_odbioru(
                        *,
                        uzytkownik:uzytkownicy(*),
                        kod_pocztowy:kody_pocztowe(*)
                    ),
                    kod_pocztowy:kody_pocztowe(*),                 
                    adresat:uzytkownicy!paczka_id_adresata_fkey(*),
                    nadawca:uzytkownicy!paczka_id_nadawcy_fkey(*)
                """)
                .eq("id_kuriera", value: courierID)
                .gte("status", value: 0)
                .lte("status", value: 1)
                .execute()
                .value
            packagesToDeliver = Dictionary(grouping: packages, by: \.postalCode.no)
        } catch {
            print("Error fetching packages: \(error)")
        }
    }

    func validatePickupCode() -> Bool {
        guard let selectedPackageForDelivery else { return false }
        return pickupCode == String(selectedPackageForDelivery.pickupCode)
    }

    func validateId() -> Bool {
        guard let selectedPickupPoint else { return false }
        return pickupCode == String(selectedPickupPoint.id)
    }

    func update(package: Package, status: Package.Status) {
        Task {
            var updateValues: some Encodable & Sendable = ["status": status.rawValue]
            if let selectedPickupPoint {
                updateValues["id_punkt_odbioru"] = selectedPickupPoint.id
            }

            try await supabase.client
                .from(Package.tableName)
                .update(updateValues)
                .eq("id", value: package.id)
                .execute()

            await fetchPackages()
        }
    }
}

#Preview {
    CourierView()
}
