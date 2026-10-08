import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  fullName: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  fullName: null
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);

 useEffect(() => {
  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user ?? null);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setFullName(profile?.full_name ?? null);
    }

    setLoading(false);
  };

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_, session) => {
    setUser(session?.user ?? null);

    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      setFullName(profile?.full_name ?? null);
    } else {
      setFullName(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);

  return (
    <AuthContext.Provider
  value={{
    user,
    loading,
    fullName,
  }}
>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);