"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User, Lock } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.roles === "administrador") router.push("/admin/afiliado");
        else if (data.roles === "comercio") router.push("/comercio");
        else if (data.roles === "afiliado") router.push("/afiliado");
        else {
          setError("Rol no válido para este login");
          setLoading(false);
        }
      } else {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
      }
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-green-700 to-red-500 overflow-hidden">
      {/* Fondos geométricos */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-800 rotate-45 opacity-70 rounded-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500 -rotate-45 opacity-80 rounded-3xl"></div>

      {/* Contenedor principal */}
      <div className="relative z-10 bg-white/90 dark:bg-gray-900/90 shadow-2xl rounded-3xl p-10 w-full max-w-md backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="w-30 h-30 mx-auto rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden ring-2 ring-yellow-500/60">
            <Image src="/logo.png" alt="Soyem" width={300} height={300} priority className="object-contain" />
          </div>
          <h1 className="text-2xl font-semibold mt-4 text-gray-800 dark:text-gray-100">
            ¡Bienvenido!
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-yellow-500/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Input Usuario */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              className="w-full px-4 pl-10 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 dark:text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Input Contraseña */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 pl-10 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-gray-900 dark:text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Botón de login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Iniciando sesión...
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
