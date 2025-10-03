//
//  DeliverPackageCardView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Factory
import SwiftUI

struct DeliverPackageCardView: View {
    let package: Package

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Numer paczki: ") + Text(String(package.id)).bold()

                Text(package.streetDescription).bold()
            }

            Spacer()

            if package.packageStatus == .created {
                Label("Nieodebrana", systemImage: "exclamationmark.triangle")
                    .foregroundStyle(package.packageStatus.color)
                    .font(.caption)
            }
        }
        .fixedSize(horizontal: false, vertical: true)
    }
}

#Preview {
    List {
        DeliverPackageCardView(package: .example)
    }
}
