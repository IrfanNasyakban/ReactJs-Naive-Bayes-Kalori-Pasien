import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaTable, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const HasilAkhirPasien = () => {
  const [hasilAkhirPasien, setHasilAkhirPasien] = useState([]);
  const [makanan, setMakanan] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getHasilAkhirPasien();
      getMakanan();
    } else {
      navigate("/");
    }
  }, [navigate]);

  const getHasilAkhirPasien = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/hasil-akhir-pasien",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHasilAkhirPasien(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getMakanan = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/dataset-makanan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMakanan(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Function untuk mendapatkan rekomendasi makanan berdasarkan kategori pasien
  const getRekomendasiMakanan = (kategoriPasien) => {
    if (kategoriPasien === "Surplus Kalori") {
      // Untuk surplus kalori, tampilkan makanan rendah kalori
      return makanan.filter((item) => item.nilai["Kalori Tinggi"] === "Ya");
    } else if (kategoriPasien === "Defisit Kalori") {
      // Untuk defisit kalori, tampilkan makanan tinggi kalori
      return makanan.filter((item) => item.nilai["Kalori Tinggi"] === "Tidak");
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.2),transparent_50%)]"></div>
      </div>

      {/* Floating Elements */}
      <div className="hidden md:block absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Main Content */}
      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Hasil Akhir Klasifikasi Pasien */}
          <div className="mb-6">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-rose-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                    <FaTable className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                      Hasil Akhir Klasifikasi Kalori
                    </h2>
                    <p className="text-sm sm:text-base text-white/80">
                      Perbandingan hasil prediksi defisit dan surplus
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white/70 font-semibold text-xs sm:text-sm">
                          Pasien
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white/70 font-semibold text-xs sm:text-sm">
                          Kategori
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white/70 font-semibold text-xs sm:text-sm">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {hasilAkhirPasien.map((hasil, index) => (
                        <tr
                          key={index}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-white/90 font-medium text-sm sm:text-base">
                            <div className="break-words">
                              {hasil.namaPasien}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                                hasil.kategori === "Defisit Kalori"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-400/30"
                                  : hasil.kategori === "Surplus Kalori"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                                  : "bg-green-500/20 text-green-400 border border-green-400/30"
                              }`}
                            >
                              {hasil.kategori}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                            {hasil.kategori === "Defisit Kalori" ? (
                              <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mx-auto" />
                            ) : hasil.kategori === "Surplus Kalori" ? (
                              <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mx-auto" />
                            ) : (
                              <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {hasilAkhirPasien.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                      <FaTable className="w-8 h-8 sm:w-12 sm:h-12 text-white/50" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white/70 mb-2">
                      Belum Ada Data
                    </h3>
                    <p className="text-sm sm:text-base text-white/50">
                      Hasil klasifikasi pasien belum tersedia. Silakan lakukan
                      perhitungan terlebih dahulu.
                    </p>
                  </div>
                )}

                {/* Summary Statistics */}
                {hasilAkhirPasien.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 sm:p-4">
                      <p className="text-orange-400 text-sm">Total Defisit</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirPasien.filter(
                            (h) => h.kategori === "Defisit Kalori"
                          ).length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirPasien.length > 0
                          ? `${(
                              (hasilAkhirPasien.filter(
                                (h) => h.kategori === "Defisit Kalori"
                              ).length /
                                hasilAkhirPasien.length) *
                              100
                            ).toFixed(1)}% dari total`
                          : "0% dari total"}
                      </p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 sm:p-4">
                      <p className="text-blue-400 text-sm">Total Surplus</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirPasien.filter(
                            (h) => h.kategori === "Surplus Kalori"
                          ).length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirPasien.length > 0
                          ? `${(
                              (hasilAkhirPasien.filter(
                                (h) => h.kategori === "Surplus Kalori"
                              ).length /
                                hasilAkhirPasien.length) *
                              100
                            ).toFixed(1)}% dari total`
                          : "0% dari total"}
                      </p>
                    </div>
                    <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <p className="text-green-400 text-sm">Total Normal</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirPasien.filter(
                            (h) => h.kategori === "Kalori Normal"
                          ).length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirPasien.length > 0
                          ? `${(
                              (hasilAkhirPasien.filter(
                                (h) => h.kategori === "Kalori Normal"
                              ).length /
                                hasilAkhirPasien.length) *
                              100
                            ).toFixed(1)}% dari total`
                          : "0% dari total"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Distribution Chart Visual */}
                {hasilAkhirPasien.length > 0 && (
                  <div className="mt-6 bg-white/5 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div>
                        <p className="text-white/70 text-sm">
                          Total Pasien Diklasifikasi
                        </p>
                        <p className="text-lg sm:text-xl font-semibold text-white">
                          {hasilAkhirPasien.length} pasien
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:flex sm:gap-4 gap-3 text-center">
                        <div>
                          <p className="text-orange-400 text-xs sm:text-sm">
                            Defisit
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-white">
                            {
                              hasilAkhirPasien.filter(
                                (h) => h.kategori === "Defisit Kalori"
                              ).length
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-400 text-xs sm:text-sm">
                            Surplus
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-white">
                            {
                              hasilAkhirPasien.filter(
                                (h) => h.kategori === "Surplus Kalori"
                              ).length
                            }
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-green-400 text-xs sm:text-sm">
                            Normal
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-white">
                            {
                              hasilAkhirPasien.filter(
                                (h) => h.kategori === "Kalori Normal"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Health Insights */}
                {hasilAkhirPasien.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-4">
                    {/* Health Status Overview */}
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border-l-4 border-purple-500">
                      <h4 className="text-white font-semibold text-sm sm:text-base mb-2">
                        📊 Ringkasan Kesehatan
                      </h4>
                      <div className="space-y-2 text-xs sm:text-sm text-white/70">
                        {hasilAkhirPasien.filter(
                          (h) => h.kategori === "Kalori Normal"
                        ).length >
                        hasilAkhirPasien.length * 0.6 ? (
                          <p>
                            ✅{" "}
                            <span className="text-green-400">
                              Mayoritas pasien
                            </span>{" "}
                            memiliki kebutuhan kalori yang normal
                          </p>
                        ) : (
                          <p>
                            ⚠️{" "}
                            <span className="text-yellow-400">
                              Perlu perhatian:
                            </span>{" "}
                            Banyak pasien membutuhkan penyesuaian kalori
                          </p>
                        )}

                        {hasilAkhirPasien.filter(
                          (h) => h.kategori === "Defisit Kalori"
                        ).length > 0 && (
                          <p>
                            🔥{" "}
                            <span className="text-orange-400">
                              {
                                hasilAkhirPasien.filter(
                                  (h) => h.kategori === "Defisit Kalori"
                                ).length
                              }{" "}
                              pasien
                            </span>{" "}
                            membutuhkan peningkatan asupan kalori
                          </p>
                        )}

                        {hasilAkhirPasien.filter(
                          (h) => h.kategori === "Surplus Kalori"
                        ).length > 0 && (
                          <p>
                            📉{" "}
                            <span className="text-blue-400">
                              {
                                hasilAkhirPasien.filter(
                                  (h) => h.kategori === "Surplus Kalori"
                                ).length
                              }{" "}
                              pasien
                            </span>{" "}
                            membutuhkan pengurangan asupan kalori
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Saran Makanan Per Pasien - Hanya untuk Surplus dan Defisit */}
                    {hasilAkhirPasien.filter(
                      (p) => p.kategori === "Surplus Kalori" || p.kategori === "Defisit Kalori"
                    ).length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-white font-semibold text-base sm:text-lg">
                          🍽️ Saran Makanan Per Pasien
                        </h4>
                        
                        {hasilAkhirPasien
                          .filter(
                            (pasien) =>
                              pasien.kategori === "Surplus Kalori" ||
                              pasien.kategori === "Defisit Kalori"
                          )
                          .map((pasien, index) => {
                            const rekomendasiMakanan = getRekomendasiMakanan(pasien.kategori);
                            
                            return (
                              <div
                                key={index}
                                className={`bg-white/5 rounded-lg p-4 border-l-4 ${
                                  pasien.kategori === "Surplus Kalori"
                                    ? "border-blue-500"
                                    : "border-orange-500"
                                }`}
                              >
                                {/* Header Pasien */}
                                <div className="mb-4">
                                  <h5 className="text-white font-semibold text-base mb-2">
                                    {pasien.namaPasien}
                                  </h5>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        pasien.kategori === "Surplis Kalori"
                                          ? "bg-orange-500/20 text-orange-400"
                                          : "bg-blue-500/20 text-blue-400"
                                      }`}
                                    >
                                      {pasien.kategori}
                                    </span>
                                    <span className="text-white/60 text-xs">
                                      {pasien.kategori === "Defisit Kalori"
                                        ? "🔽 Kurangi Kalori"
                                        : "🔼 Tambah Kalori"}
                                    </span>
                                  </div>
                                </div>

                                {/* Rekomendasi Makanan */}
                                {rekomendasiMakanan.length > 0 ? (
                                  <div>
                                    <p className="text-white/70 text-sm mb-3 font-medium">
                                      Rekomendasi Makanan:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {rekomendasiMakanan.slice(0, 25).map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all"
                                        >
                                          <div className="flex justify-between items-start gap-2 mb-2">
                                            <p className="text-white text-sm font-medium flex-1">
                                              {item.nilai["Nama Makanan"]}
                                            </p>
                                            <span
                                              className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                                item.nilai["Kalori Tinggi"] === "Ya"
                                                  ? "bg-red-500/20 text-red-400"
                                                  : "bg-green-500/20 text-green-400"
                                              }`}
                                            >
                                              {item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                                            </span>
                                          </div>
                                          
                                          <p className="text-white/50 text-xs mb-2">
                                            {item.nilai["Kategori Makanan"]}
                                          </p>

                                          {/* Badge Nutrisi */}
                                          <div className="flex flex-wrap gap-1">
                                            {item.nilai["Protein Tinggi"] === "Ya" && (
                                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                Protein
                                              </span>
                                            )}
                                            {item.nilai["Karbo Tinggi"] === "Ya" && (
                                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                                Karbo
                                              </span>
                                            )}
                                            {item.nilai["Lemak Tinggi"] === "Ya" && (
                                              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                                Lemak
                                              </span>
                                            )}
                                            {item.nilai["IG Tinggi"] === "Tidak" && (
                                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                IG Rendah
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Catatan */}
                                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                                      <p className="text-white/60 text-xs leading-relaxed">
                                        💡 {pasien.kategori === "Surplus Kalori"
                                          ? "Fokus pada makanan rendah kalori, tinggi serat, dan protein untuk membantu mengurangi asupan kalori harian."
                                          : "Konsumsi makanan tinggi kalori dan nutrisi untuk meningkatkan asupan energi harian Anda."}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-white/50 text-sm italic">
                                    Tidak ada rekomendasi makanan tersedia untuk kategori ini.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HasilAkhirPasien;