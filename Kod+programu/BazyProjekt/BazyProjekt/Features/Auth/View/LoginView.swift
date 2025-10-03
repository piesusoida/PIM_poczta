//
//  LoginView.swift
//  BazyProjekt
//
//  Created by Wojciech Kozioł on 29/12/2024.
//

import Factory
import SwiftUI

struct LoginView: View {
    @Injected(\.supabaseService) var supabaseService

    @State var isRegister = false
    @State var firstName = ""
    @State var lastName = ""
    @State var phoneNumber = ""

    @State var email = ""
    @State var password = ""
    @State var isLoading = false

    var body: some View {
        NavigationStack {
            VStack {
                if isRegister {
                    TextField("Imię", text: $firstName)

                    TextField("Nazwisko", text: $lastName)
                        .autocorrectionDisabled()

                    TextField("Telefon", text: $phoneNumber)
                        .keyboardType(.phonePad)
                }

                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                
                SecureField("Hasło", text: $password)
                
                Button {
                    Task {
                        isLoading = true
                        defer { isLoading = false }
                        if isRegister {
                            await register()
                        } else {
                            await login()
                        }
                    }
                } label: {
                    if isLoading {
                        ProgressView()
                    } else {
                        Text(isRegister ? "Zarejestruj się" : "Zaloguj się")
                    }
                }
                .buttonStyle(.borderedProminent)
                
                Button(isRegister ? "Mam już konto" : "Stwórz konto") {
                    withAnimation {
                        isRegister.toggle()
                    }
                }
            }
            .textFieldStyle(.roundedBorder)
            .padding()
            .navigationTitle(isRegister ? "Zarejestruj się" : "Zaloguj się")
        }
    }
}

extension LoginView {
    func login() async {
        let _ = try? await supabaseService.client.auth.signIn(email: email, password: password)
    }

    func register() async {
        let _ = try? await supabaseService.client.auth.signUp(email: email, password: password)

        let user = User.Create(name: firstName, surname: lastName, phoneNo: phoneNumber, email: email)
        let _ = try? await supabaseService.client
            .from(User.tableName)
            .insert(user)
            .execute()
    }
}

#Preview {
    LoginView()
}
