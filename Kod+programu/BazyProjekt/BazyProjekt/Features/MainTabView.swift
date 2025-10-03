//
//  MainTabView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct MainTabView: View {
    @Injected(\.userController) var userController

    var body: some View {
        TabView {
            if userController.isPickupPoint {
                PickupPointView()
                    .tabItem {
                        Label("Punkt odbioru", systemImage: "shippingbox.and.arrow.backward")
                    }
            } else {
                PackageView()
                    .tabItem {
                        Label("Paczki", systemImage: "shippingbox")
                    }
            }

            if userController.isCourier {
                CourierView()
                    .tabItem {
                        Label("Do dostarczenia", systemImage: "truck.box")
                    }
            }

            if userController.isManager {
                ManagerView()
                    .tabItem {
                        Label("Kierownik", systemImage: "person.3")
                    }
            }

            UserView()
                .tabItem {
                    Label("Profil", systemImage: "person")
                }
        }
    }
}

#Preview {
    MainTabView()
}
