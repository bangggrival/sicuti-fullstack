const { z } = require('zod');

// Auth Schemas
const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').max(50, 'Username terlalu panjang'),
  password: z.string().min(1, 'Password wajib diisi')
});

const forgotPasswordSchema = z.object({
  nip: z.string().min(1, 'NIP wajib diisi')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  newPassword: z.string().min(6, 'Kata sandi minimal 6 karakter')
});

// Pengajuan Cuti Schemas
const pengajuanSchema = z.object({
  jenisCuti: z.enum(['tahunan', 'sakit', 'melahirkan', 'alasan_penting', 'besar', 'diluar_tanggungan'], {
    errorMap: () => ({ message: 'Jenis cuti tidak valid' })
  }),
  tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggalMulai harus YYYY-MM-DD'),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggalSelesai harus YYYY-MM-DD'),
  jumlahHari: z.number().int().positive('Jumlah hari harus lebih dari 0'),
  alasan: z.string().min(1, 'Alasan wajib diisi').max(500, 'Alasan maksimal 500 karakter'),
  penggantiTugas: z.string().max(255).optional().nullable()
});

const reviewPengajuanSchema = z.object({
  status: z.enum(['disetujui', 'ditolak'], {
    errorMap: () => ({ message: 'Status harus disetujui atau ditolak' })
  })
});

// User Schemas
const createUserSchema = z.object({
  nip: z.string().min(1, 'NIP wajib diisi').max(50),
  username: z.string().min(3, 'Username minimal 3 karakter').max(50),
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  role: z.enum(['pegawai', 'pengawas', 'kasie']),
  jabatan: z.string().min(1, 'Jabatan wajib diisi').max(100),
  unit: z.string().min(1, 'Unit wajib diisi').max(100),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  pengawasId: z.number().int().positive().optional().nullable()
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100).optional(),
  username: z.string().min(3, 'Username minimal 3 karakter').max(50).optional(),
  jabatan: z.string().min(1, 'Jabatan wajib diisi').max(100).optional(),
  unit: z.string().min(1, 'Unit wajib diisi').max(100).optional(),
  role: z.enum(['pegawai', 'pengawas', 'kasie']).optional(),
  pengawasId: z.number().int().positive().optional().nullable(),
  password: z.string().min(6).optional()
});

// Libur Schemas
const liburSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi').max(255)
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  pengajuanSchema,
  reviewPengajuanSchema,
  createUserSchema,
  updateUserSchema,
  liburSchema
};
