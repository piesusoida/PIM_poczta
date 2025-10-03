//
//  PostalCode.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 09/01/2025.
//

import Foundation

struct PostalCode: Decodable, Identifiable, Hashable {
    let id: Int
    let no: String

    static let example = PostalCode(id: 0, no: "12-345")

    static let tableName = "kody_pocztowe"

    enum CodingKeys: String, CodingKey {
        case id
        case no = "numer"
    }
}

extension PostalCode {
    struct Create: Encodable {
        let no: String

        enum CodingKeys: String, CodingKey {         
            case no = "numer"
        }
    }
}
