//
//  Package.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Foundation
import SwiftUI

struct Package: Decodable, Identifiable {
    let id: Int
    let receiver: User?
    let postalCode: PostalCode
    let street: String
    let streetNo: Int
    let apartmentNo: Int?
    let weight: Double
    let size: Double
    let status: Int
    let sender: User
    let pickupCode: Int
    let pickupPoint: PickupPoint?
    let receiverEmail: String
    let receiverPhoneNo: String

    var streetDescription: String {
        "ul. \(street) \(streetNo)\(apartmentNo != nil ? "/\(apartmentNo!)" : "")"
    }

    var packageStatus: Status {
        Package.Status(rawValue: status)!
    }

    static let example = Package(id: 0, receiver: .example, postalCode: .example, street: "Street", streetNo: 1, apartmentNo: 2, weight: 2.5, size: 12.56, status: 1, sender: .example, pickupCode: 1234, pickupPoint: nil, receiverEmail: "email@example.com", receiverPhoneNo: "123123123")

    static let tableName = "paczki"

    enum CodingKeys: String, CodingKey {
        case id
        case receiver = "adresat"
        case postalCode = "kod_pocztowy"
        case street = "ulica"
        case streetNo = "nr_budynku"
        case apartmentNo = "nr_lokalu"
        case weight = "waga"
        case size = "wymiary"
        case status
        case sender = "nadawca"
        case pickupCode = "kod_odbioru"
        case pickupPoint = "punkt_odbioru"
        case receiverEmail = "email_adresata"
        case receiverPhoneNo = "telefon_adresata"
    }
}

extension Package {
    enum Status: Int, CustomStringConvertible, RawRepresentable {
        case created = 0
        case transport = 1
        case pickupPoint = 2
        case received = 3

        var description: String {
            switch self {
            case .created:
                "Utworzona"
            case .transport:
                "W transporcie"
            case .pickupPoint:
                "Punkt odbioru"
            case .received:
                "Dostarczona"
            }
        }

        var color: Color {
            switch self {
            case .created:
                    .blue
            case .transport:
                    .green
            case .pickupPoint:
                    .orange
            case .received:
                    .red
            }
        }
    }
}

extension Package {
    struct Create: Encodable {
        let receiverID: Int?
        let postalCodeID: Int
        let street: String
        let streetNo: Int
        let apartmentNo: Int?
        let weight: Double
        let size: Double
        let senderID: Int
        let pickupCode: Int
        let courierID: Int
        let receiverEmail: String
        let receiverPhoneNo: String

        enum CodingKeys: String, CodingKey {
            case receiverID = "id_adresata"
            case postalCodeID = "id_kod_pocztowy"
            case street = "ulica"
            case streetNo = "nr_budynku"
            case apartmentNo = "nr_lokalu"
            case weight = "waga"
            case size = "wymiary"
            case senderID = "id_nadawcy"
            case pickupCode = "kod_odbioru"
            case courierID = "id_kuriera"
            case receiverEmail = "email_adresata"
            case receiverPhoneNo = "telefon_adresata"
        }

        static func generatePickupCode() -> Int {
            Int.random(in: 1000...9999)
        }
    }
}
