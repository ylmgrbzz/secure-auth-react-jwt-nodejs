import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { logoutAsync, verifyToken } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../store/store";

export default function Dashboard() {
  const { user, loading, error } = useSelector(
    (state: RootState) => state.auth
  );
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Token doğrulama
  useEffect(() => {
    dispatch(verifyToken());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      const result = await dispatch(logoutAsync());
      if (logoutAsync.fulfilled.match(result)) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Çıkış yapılırken bir hata oluştu:", error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Hoş geldin, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500 text-xl">
                  Hoş geldiniz! Bu sizin güvenli alanınız.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
