//
//  SupabaseService.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Foundation
import Supabase

class SupabaseService {
    let client: SupabaseClient
    static let shared = SupabaseService()

    init() {
        client = SupabaseClient(supabaseURL: URL(string: "https://gresiabebpizwkkucanw.supabase.co")!, supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZXNpYWJlYnBpendra3VjYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NzE4NjAsImV4cCI6MjA1MTA0Nzg2MH0.pssAedQhfPbgC9ZkQciOQpmFXb8F-X8FlP2CCVpuopQ")
    }
}
