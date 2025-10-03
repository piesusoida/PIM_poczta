//
//  Courier.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Foundation

struct Courier: Decodable, Identifiable {
    let id: Int
    let user: User

    static let example = Courier(id: 0, user: .example)

    static let tableName = "kurierzy"

    enum CodingKeys: String, CodingKey {
        case id
        case user = "uzytkownik"
    }
}

extension Courier {
    struct Create: Encodable {
        let id_uzytkownika: Int
    }
}
