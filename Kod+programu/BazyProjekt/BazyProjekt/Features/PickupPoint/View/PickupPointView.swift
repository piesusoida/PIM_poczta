//
//  PickupPointView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct PickupPointView: View {
    @Injected(\.supabaseService) var supabase
    @Injected(\.userController) var userController

    @State var packages: [Package] = []
    @State var searchText = ""

    @State var showingPickupCodeAlert = false
    @State var selectedPackage: Package?
    @State var pickupCode = ""

    var filteredPackages: [Package] {
        if searchText.isEmpty { return packages }
        return packages.filter { package in
            String(package.id).localizedStandardContains(searchText) ||
            package.receiverPhoneNo.localizedStandardContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(filteredPackages) { package in
                    PickupPointPackageView(package: package)
                    .contentShape(.rect)
                    .onTapGesture {
                        pickupCode = ""
                        selectedPackage = package
                        showingPickupCodeAlert = true
                    }
                }
            }
            .refreshable {
                await fetchData()
            }
            .searchable(text: $searchText)
            .navigationTitle("Przechowywane")
        }
        .alert("Wpisz kod odbioru", isPresented: $showingPickupCodeAlert) {
            TextField("Kod odbioru", text: $pickupCode)
                .keyboardType(.numberPad)

            Button("Anuluj", role: .cancel) { }

            Button("Wydaj") {
                Task { await releasePackage() }
            }
        }
        .task {
            await fetchData()
        }
    }
}

extension PickupPointView {
    func fetchData() async {
        do {
            packages = try await supabase.client
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
                .eq("punkty_odbioru.id_uzytkownika", value: userController.currentUser.id)
                .eq("status", value: Package.Status.pickupPoint.rawValue)
                .execute()
                .value
        } catch {
            print("Error fetching data: \(error)")
        }
    }

    func releasePackage() async {
        guard let selectedPackage, String(selectedPackage.pickupCode) == pickupCode else {
            pickupCode = ""
            showingPickupCodeAlert = true
            return
        }

        do {
            try await supabase.client
                .from(Package.tableName)
                .update(["status": Package.Status.received.rawValue])
                .eq("id", value: selectedPackage.id)
                .execute()

            packages.removeAll(where: { $0.id == selectedPackage.id })
        } catch {
            print("Error releasing package: \(error)")
        }
    }
}

#Preview {
    PickupPointView()
}
