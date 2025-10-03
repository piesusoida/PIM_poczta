//
//  PackageView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct PackageView: View {
    @Injected(\.supabaseService) var supabase

    @State var receivePackages: [Package] = []
    @State var sentPackages: [Package] = []
    @State var isAddSheetVisible = false

    @State var isAlertVisible = false
    @State var selectedPackage: Package?

    @State var hiddenPackages: [Int] = []

    var body: some View {
        NavigationStack {
            List {
                Section("Odbierane") {
                    ForEach(receivePackages) { package in
                        PackageCardView(package: package, isSent: false)
                            .deleteDisabled(Package.Status(rawValue: package.status) != .received)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedPackage = package
                                isAlertVisible = true
                            }
                    }
                    .onDelete { indexSet in
                        deletePackage(at: indexSet, fromSent: false)
                    }
                }

                Section("Wysyłane") {
                    ForEach(sentPackages) { package in
                        PackageCardView(package: package, isSent: true)
                            .deleteDisabled(Package.Status(rawValue: package.status) != .received)
                    }
                    .onDelete { indexSet in
                        deletePackage(at: indexSet, fromSent: true)
                    }
                }
            }
            .refreshable {
                Task {
                    await Container.shared.userController().fetch()
                    await fetchPackages()
                }
            }
            .toolbar {
                Button("Dodaj", systemImage: "plus") {
                    isAddSheetVisible = true
                }
            }
            .navigationTitle("Paczki")
        }
        .alert("Szczegóły przesyłki", isPresented: $isAlertVisible) {
        } message: {
            Text(packageDetailsText)
        }
        .sheet(isPresented: $isAddSheetVisible) {
            AddPackageView() {
                Task { await fetchPackages() }
            }
        }
        .task { await fetchPackages() }
    }
}

extension PackageView {
    var packageDetailsText: String {
        guard let selectedPackage else { return "" }

        var result = ""
        result += "Paczka nr: \(selectedPackage.id)"
        result += "\nStatus: \(Package.Status(rawValue: selectedPackage.status)!)"

        if selectedPackage.status < Package.Status.received.rawValue {
            result += "\nKod odbioru: \(selectedPackage.pickupCode)"
            if let pickupPoint = selectedPackage.pickupPoint {
                result += "\nAdres odbioru: \(pickupPoint.streetDescription)"
            }
        }
        return result
    }

    func deletePackage(at indexSet: IndexSet, fromSent: Bool) {
        for i in indexSet {
            let packageToDelete = fromSent ? sentPackages[i] : receivePackages[i]
            hiddenPackages.append(packageToDelete.id)
        }
        UserDefaults.standard.set(hiddenPackages, forKey: "hiddenPackages")
        fromSent ? sentPackages.remove(atOffsets: indexSet) : receivePackages.remove(atOffsets: indexSet)
    }

    func fetchPackages() async {
        hiddenPackages = UserDefaults.standard.array(forKey: "hiddenPackages") as? [Int] ?? []

        guard let user = Container.shared.userController().currentUser else { return }
        do {
            receivePackages = try await supabase.client
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
                .eq("id_adresata", value: user.id)
                .order("status", ascending: true)
                .execute()
                .value
            receivePackages = receivePackages.filter { !hiddenPackages.contains($0.id) }

            sentPackages = try await supabase.client
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
                .eq("id_nadawcy", value: user.id)
                .order("status", ascending: true)
                .execute()
                .value
            sentPackages = sentPackages.filter { !hiddenPackages.contains($0.id) }
        } catch {
            print("Error fetching packages: \(error)")
        }
    }
}

#Preview {
    PackageView()
}
