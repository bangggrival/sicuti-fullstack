-- Seed Data Initial Users (Password: 123456)
-- Bcrypt Hash for '123456' : $2a$10$eE.l1J5Z0.Z2PzJ1z.1uue60G8k92P6w7p8o.0X5a7rY.x8w7v1eS

INSERT INTO users (id, nip, username, password, name, role, jabatan, unit, avatar, sisa_cuti, color, no_wa) VALUES
(1, '197605142010031001', 'bambang', '$2a$10$eE.l1J5Z0.Z2PzJ1z.1uue60G8k92P6w7p8o.0X5a7rY.x8w7v1eS', 'Dr. Bambang Sugiarto, M.Si', 'kasie', 'Kepala Seksi', 'Semua Seksi', 'BS', 12, '#0891B2', '081234567890'),
(2, '198507122015041001', 'hendra', '$2a$10$eE.l1J5Z0.Z2PzJ1z.1uue60G8k92P6w7p8o.0X5a7rY.x8w7v1eS', 'Drs. Hendra Wijaya', 'pengawas', 'Pengawas Tim A', 'Seksi Pelayanan & Keuangan', 'HW', 12, '#D97706', '081298765432'),
(3, '198203082014041002', 'dewi', '$2a$10$eE.l1J5Z0.Z2PzJ1z.1uue60G8k92P6w7p8o.0X5a7rY.x8w7v1eS', 'Ir. Dewi Lestari', 'pengawas', 'Pengawas Tim B', 'Seksi Teknologi', 'DL', 12, '#DB2777', '081355556666')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, nip, username, password, name, role, jabatan, unit, avatar, pengawas_id, sisa_cuti, color, no_wa) VALUES
(4, '199001012020011001', 'ahmad', '$2a$10$eE.l1J5Z0.Z2PzJ1z.1uue60G8k92P6w7p8o.0X5a7rY.x8w7v1eS', 'Ahmad Fauzi', 'pegawai', 'Staf Administrasi', 'Seksi Pelayanan', 'AF', 2, 12, '#2563EB', '081211112222'),
(5, '199205152019022002', 'siti', '$2a$10$eE.l1J5Z0.Z2PzJ1z.1uue60G8k92P6w7p8o.0X5a7rY.x8w7v1eS', 'Siti Rahayu', 'pegawai', 'Staf Keuangan', 'Seksi Keuangan', 'SR', 2, 8, '#7C3AED', '081233334444'),
(6, '198811032018013003', 'budi', '$2a$10$eE.l1J5Z0.Z2PzJ1z.1uue60G8k92P6w7p8o.0X5a7rY.x8w7v1eS', 'Budi Santoso', 'pegawai', 'Staf IT', 'Seksi Teknologi', 'BS', 3, 5, '#059669', '081277778888')
ON CONFLICT (id) DO NOTHING;

-- Reset Sequence ID Users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Seed Initial Pengajuan Cuti
INSERT INTO pengajuan_cuti (kode, pegawai_id, jenis_cuti, tanggal_mulai, tanggal_selesai, jumlah_hari, alasan, status, pengawas_id, created_at) VALUES
('CUT-2025-001', 4, 'tahunan', '2025-08-05', '2025-08-07', 3, 'Keperluan keluarga di kampung halaman', 'diajukan', 2, '2025-07-25'),
('CUT-2025-002', 5, 'sakit', '2025-07-28', '2025-07-30', 3, 'Sakit demam berdarah, perlu istirahat total', 'diajukan', 2, '2025-07-28')
ON CONFLICT DO NOTHING;
