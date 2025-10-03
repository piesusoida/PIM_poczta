//
//  Manager.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Foundation

struct Manager: Decodable, Identifiable {
    let id: Int
    let user: User

    static let tableName = "kierownicy"
}

extension Manager {
    struct Create: Encodable {
        let id_uzytkownika: Int
    }
}
