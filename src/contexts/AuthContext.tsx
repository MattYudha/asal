// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../api/supabaseClient"; // Pastikan path ini benar

// Definisikan tipe untuk objek user Anda (sesuai dengan Supabase atau Firebase)
interface AuthUser {
  id: string;
  email: string | undefined;
  // Tambahkan properti user lainnya jika ada
  // Anda mungkin perlu menambahkan 'name' dan 'image' jika digunakan di Dashboard.tsx
  // Contoh: name?: string; image?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // Tambahkan fungsi atau state terkait otentikasi lainnya jika diperlukan
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Perbaikan di sini: Ambil langsung objek 'subscription'
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Sesuaikan dengan data user yang Anda butuhkan
        setUser({
          id: session.user.id,
          email: session.user.email,
          // Jika Anda mengakses user?.name atau user?.image di komponen lain
          // seperti Dashboard.tsx, pastikan data tersebut tersedia di session.user.user_metadata
          // Contoh:
          // name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          // image: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Ambil sesi awal untuk inisialisasi user saat komponen dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Sesuaikan dengan data user yang Anda butuhkan
        setUser({
          id: session.user.id,
          email: session.user.email,
          // Contoh:
          // name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          // image: session.user.user_metadata?.avatar_url,
        });
      }
      setLoading(false);
    });

    // Fungsi cleanup untuk menghentikan listener saat komponen di-unmount
    return () => {
      // Perbaikan di sini: Panggil unsubscribe pada objek subscription yang benar
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Dependensi array kosong agar effect hanya berjalan sekali saat mount dan cleanup saat unmount

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
