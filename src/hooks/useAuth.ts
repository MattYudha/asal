// src/hooks/useAuth.ts
// Ini adalah file hook sederhana yang mengimpor useAuth dari context Anda.
// Hal ini sering dilakukan untuk membuat path impor lebih singkat dan konsisten.
import { useAuth as useContextAuth } from "../contexts/AuthContext"; // Pastikan path ini benar

export function useAuth() {
  return useContextAuth();
}
