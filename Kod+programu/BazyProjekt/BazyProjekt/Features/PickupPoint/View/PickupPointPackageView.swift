//
//  PickupPointPackageView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 11/01/2025.
//

import SwiftUI

struct PickupPointPackageView: View {
    let package: Package

    var body: some View {
        VStack(alignment: .leading) {
            Text("Nr przesyłki: ") + Text(String(package.id)).bold()

            Text("Nr telefonu odbiorcy: ") + Text(package.receiverPhoneNo).bold()
        }
    }
}

#Preview {
    PickupPointPackageView(package: .example)
}
