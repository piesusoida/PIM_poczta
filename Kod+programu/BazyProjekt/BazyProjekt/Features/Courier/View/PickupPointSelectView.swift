//
//  PickupPointSelectView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Factory
import SwiftUI

struct PickupPointSelectView: View {
    @Injected(\.supabaseService) var supabase
    @Environment(\.dismiss) var dismiss

    @State var searchText = ""
    @State var availablePickupPoints: [PickupPoint] = []

    let postalCodeNo: String
    let onSelect: (PickupPoint) -> Void

    var filteredPickupPoints: [PickupPoint] {
        if searchText.isEmpty {
            return availablePickupPoints
        }
        return availablePickupPoints.filter { pickupPoint in
            pickupPoint.streetDescription.localizedStandardContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(filteredPickupPoints) { pickupPoint in
                    VStack(alignment: .leading) {
                        Text(pickupPoint.name).bold()
                        Text(pickupPoint.streetDescription)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        onSelect(pickupPoint)
                        dismiss()
                    }
                }
                .searchable(text: $searchText)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Anuluj") {
                        dismiss()
                    }
                }
            }
        }
        .task {
            await fetchPickupPoints()
        }
    }

    func fetchPickupPoints() async {
        do {
            availablePickupPoints = try await supabase.client
                .from(PickupPoint.tableName)
                .select("""
                    *,
                    kod_pocztowy:kody_pocztowe(*),
                    uzytkownik:uzytkownicy(*)
                """)
                .eq("kody_pocztowe.numer", value: postalCodeNo)
                .execute()
                .value
        } catch {
            print("Error fetching pickup points: \(error)")
            dismiss()
        }
    }
}

#Preview {
    PickupPointSelectView(postalCodeNo: "") { _ in }
}
