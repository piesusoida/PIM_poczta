-- Enable UUID extension for auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (uzytkownicy)
CREATE TABLE IF NOT EXISTS uzytkownicy (
    id SERIAL PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    nr_telefonu VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. POSTAL CODES TABLE (kody_pocztowe)
CREATE TABLE IF NOT EXISTS kody_pocztowe (
    id SERIAL PRIMARY KEY,
    numer VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COURIERS TABLE (kurierzy)
CREATE TABLE IF NOT EXISTS kurierzy (
    id SERIAL PRIMARY KEY,
    id_uzytkownika INTEGER NOT NULL REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_uzytkownika)
);

-- 4. MANAGERS TABLE (kierownicy)
CREATE TABLE IF NOT EXISTS kierownicy (
    id SERIAL PRIMARY KEY,
    id_uzytkownika INTEGER NOT NULL REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_uzytkownika)
);

-- 5. PICKUP POINTS TABLE (punkty_odbioru)
CREATE TABLE IF NOT EXISTS punkty_odbioru (
    id SERIAL PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL,
    id_uzytkownika INTEGER NOT NULL REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    id_kod_pocztowy INTEGER NOT NULL REFERENCES kody_pocztowe(id) ON DELETE RESTRICT,
    ulica VARCHAR(255) NOT NULL,
    nr_budynku INTEGER NOT NULL,
    nr_lokalu INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PACKAGES TABLE (paczki)
CREATE TABLE IF NOT EXISTS paczki (
    id SERIAL PRIMARY KEY,
    id_adresata INTEGER REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    id_kod_pocztowy INTEGER NOT NULL REFERENCES kody_pocztowe(id) ON DELETE RESTRICT,
    ulica VARCHAR(255) NOT NULL,
    nr_budynku INTEGER NOT NULL,
    nr_lokalu INTEGER,
    waga DECIMAL(10, 2) NOT NULL CHECK (waga > 0),
    wymiary DECIMAL(10, 2) NOT NULL CHECK (wymiary > 0),
    status INTEGER NOT NULL DEFAULT 0 CHECK (status BETWEEN 0 AND 3),
    id_nadawcy INTEGER NOT NULL REFERENCES uzytkownicy(id) ON DELETE RESTRICT,
    kod_odbioru INTEGER NOT NULL CHECK (kod_odbioru BETWEEN 1000 AND 9999),
    id_kuriera INTEGER NOT NULL REFERENCES kurierzy(id) ON DELETE RESTRICT,
    punkt_odbioru INTEGER REFERENCES punkty_odbioru(id) ON DELETE SET NULL,
    email_adresata VARCHAR(255) NOT NULL,
    telefon_adresata VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uzytkownicy_auth_id ON uzytkownicy(auth_id);
CREATE INDEX IF NOT EXISTS idx_uzytkownicy_email ON uzytkownicy(email);
CREATE INDEX IF NOT EXISTS idx_kurierzy_uzytkownik ON kurierzy(id_uzytkownika);
CREATE INDEX IF NOT EXISTS idx_kierownicy_uzytkownik ON kierownicy(id_uzytkownika);
CREATE INDEX IF NOT EXISTS idx_punkty_odbioru_uzytkownik ON punkty_odbioru(id_uzytkownika);
CREATE INDEX IF NOT EXISTS idx_paczki_nadawca ON paczki(id_nadawcy);
CREATE INDEX IF NOT EXISTS idx_paczki_adresat ON paczki(id_adresata);
CREATE INDEX IF NOT EXISTS idx_paczki_kurier ON paczki(id_kuriera);
CREATE INDEX IF NOT EXISTS idx_paczki_status ON paczki(status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE uzytkownicy ENABLE ROW LEVEL SECURITY;
ALTER TABLE kody_pocztowe ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurierzy ENABLE ROW LEVEL SECURITY;
ALTER TABLE kierownicy ENABLE ROW LEVEL SECURITY;
ALTER TABLE punkty_odbioru ENABLE ROW LEVEL SECURITY;
ALTER TABLE paczki ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - allow authenticated users to read/write)
-- Users can read all users
CREATE POLICY "Users can view all users" ON uzytkownicy
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own data
CREATE POLICY "Users can update own data" ON uzytkownicy
    FOR UPDATE USING (auth.uid() = auth_id);

-- Everyone can read postal codes
CREATE POLICY "Anyone can view postal codes" ON kody_pocztowe
    FOR SELECT USING (true);

-- Authenticated users can read couriers
CREATE POLICY "Authenticated users can view couriers" ON kurierzy
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can read managers
CREATE POLICY "Authenticated users can view managers" ON kierownicy
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can read pickup points
CREATE POLICY "Authenticated users can view pickup points" ON punkty_odbioru
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can manage packages
CREATE POLICY "Authenticated users can view packages" ON paczki
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create packages" ON paczki
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update packages" ON paczki
    FOR UPDATE USING (auth.role() = 'authenticated');