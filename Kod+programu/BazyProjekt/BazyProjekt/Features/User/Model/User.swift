//
//  User.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Foundation

struct User: Decodable, Identifiable, Hashable {
    let id: Int
    let name: String
    let surname: String
    let phoneNo: String
    let email: String

    static let example = User(id: 0, name: "Name", surname: "Surname", phoneNo: "999888777", email: "email@example.com")

    static let tableName = "uzytkownicy"

    enum CodingKeys: String, CodingKey {
        case id
        case name = "imie"
        case surname = "nazwisko"
        case phoneNo = "nr_telefonu"
        case email
    }
}

extension User {
    struct Create: Encodable {
        let name: String
        let surname: String
        let phoneNo: String
        let email: String

        enum CodingKeys: String, CodingKey {
            case name = "imie"
            case surname = "nazwisko"
            case phoneNo = "nr_telefonu"
            case email
        }
    }
}
