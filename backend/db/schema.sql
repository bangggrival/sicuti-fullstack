DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS hari_libur CASCADE;
DROP TABLE IF EXISTS token_blacklist CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS notifikasi CASCADE;
DROP TABLE IF EXISTS pengajuan_cuti CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  nip         VARCHAR(30) UNIQUE NOT NULL,
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('pegawai', 'pengawas', 'kasie')),
  jabatan     VARCHAR(100) NOT NULL,
  unit        VARCHAR(100) NOT NULL,
  avatar      VARCHAR(10) NOT NULL,
  pengawas_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sisa_cuti   INTEGER DEFAULT 12,
  sisa_cuti_sabtu INTEGER DEFAULT 1,
  sisa_cuti_minggu INTEGER DEFAULT 1,
  color       VARCHAR(20) DEFAULT '#2563EB',
  no_wa       VARCHAR(20) DEFAULT '-',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Pengajuan Cuti Table
CREATE TABLE pengajuan_cuti (
  id              SERIAL PRIMARY KEY,
  kode            VARCHAR(20) UNIQUE NOT NULL,
  pegawai_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jenis_cuti      VARCHAR(50) NOT NULL,
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  jumlah_hari     INTEGER NOT NULL,
  alasan          TEXT NOT NULL,
  pengganti_tugas VARCHAR(100),
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'diajukan', 'diketahui', 'disetujui', 'ditolak')),
  pengawas_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  pengawas_note   TEXT,
  pengawas_tgl    DATE,
  kasie_note      TEXT,
  kasie_tgl       DATE,
  surat_sakit_url VARCHAR(255),
  created_at      DATE DEFAULT CURRENT_DATE,
  updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifikasi Table
CREATE TABLE notifikasi (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  type       VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'error', 'warning')),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Token Blacklist Table
CREATE TABLE token_blacklist (
  id         SERIAL PRIMARY KEY,
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Hari Libur Table
CREATE TABLE hari_libur (
  id         SERIAL PRIMARY KEY,
  tanggal    DATE UNIQUE NOT NULL,
  keterangan VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Password Resets Table
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
