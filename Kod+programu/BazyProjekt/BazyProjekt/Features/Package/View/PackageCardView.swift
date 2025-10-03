//
//  PackageCardView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct PackageCardView: View {
    let package: Package
    let isSent: Bool

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(isSent ? "Do \(package.receiverEmail)" : "Od \(package.sender.email)")
                    .bold()

                if let pickupPoint = package.pickupPoint {
                    Text(pickupPoint.streetDescription)
                } else {
                    Text(package.streetDescription)
                }

                Text(Package.Status(rawValue: package.status)!.description)
                    .font(.caption)
                    .foregroundStyle(.white)
                    .padding(5)
                    .background(package.packageStatus.color)
                    .clipShape(.rect(cornerRadius: 8))
            }

            Spacer()

            VStack(alignment: .trailing) {
                Image(systemName: "arrow.\(isSent ? "up" : "down").right")
                
                Spacer()

                if !isSent && ![.received].contains(package.packageStatus) {
                    Group {
                        Text("Kod odbioru")
                        Text(String(package.pickupCode))
                    }
                    .font(.caption)
                }
            }
        }
        .fixedSize(horizontal: false, vertical: true)
    }
}

#Preview {
    List {
        PackageCardView(package: .example, isSent: false)
    }
}
