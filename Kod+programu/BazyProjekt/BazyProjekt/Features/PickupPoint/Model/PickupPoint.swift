//
//  PickupPoint.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Foundation

struct PickupPoint: Decodable, Identifiable {
    let id: Int
    let name: String
    let user: User
    let postalCode: PostalCode
    let street: String
    let streetNo: Int
    let apartmentNo: Int?

    var streetDescription: String {
        "ul. \(street) \(streetNo)\(apartmentNo != nil ? "/\(apartmentNo!)" : "")"
    }

    static let tableName = "punkty_odbioru"

    enum CodingKeys: String, CodingKey {
        case id
        case name = "nazwa"
        case user = "uzytkownik"
        case postalCode = "kod_pocztowy"
        case street = "ulica"
        case streetNo = "nr_budynku"
        case apartmentNo = "nr_lokalu"
    }
}

extension PickupPoint {
    struct Create: Encodable {
        let name: String
        let userID: Int
        let postalCodeID: Int
        let street: String
        let streetNo: Int
        let apartmentNo: Int?

        enum CodingKeys: String, CodingKey {
            case name = "nazwa"
            case userID = "id_uzytkownika"
            case postalCodeID = "id_kod_pocztowy"
            case street = "ulica"
            case streetNo = "nr_budynku"
            case apartmentNo = "nr_lokalu"
        }
    }
}
