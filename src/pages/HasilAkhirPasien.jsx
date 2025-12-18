import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaTable, FaCheckCircle, FaExclamationTriangle, FaPrint } from "react-icons/fa";

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

  // Function untuk shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function untuk mendapatkan makanan random berdasarkan kategori spesifik
  const getRandomBySpecificCategory = (foods, categoryName, count) => {
    const filtered = foods.filter(food => {
      const kategori = food.nilai["Kategori Makanan"];
      return kategori && kategori.toLowerCase().includes(categoryName.toLowerCase());
    });
    
    const shuffled = shuffleArray(filtered);
    return shuffled.slice(0, count);
  };

  // Function untuk mendapatkan rekomendasi makanan berdasarkan kategori pasien
  // Surplus: 7 tinggi + 3 rendah = 10 total (Karbo 3, Protein 3, Serat 2, Camilan 2)
  // Normal: 5 tinggi + 5 rendah = 10 total
  // Defisit: 10 rendah = 10 total
  const getRekomendasiMakanan = (kategoriPasien) => {
    let result = [];
    
    if (kategoriPasien === "Surplus Kalori") {
      // Untuk surplus kalori: 7 makanan tinggi kalori + 3 makanan rendah kalori = 10 total
      // Distribusi: Karbohidrat (3), Protein (3), Serat (2), Camilan (2)
      const kaloriTinggi = makanan.filter((item) => item.nilai["Kalori Tinggi"] === "Ya");
      const kaloriRendah = makanan.filter((item) => item.nilai["Kalori Tinggi"] === "Tidak");
      
      // Karbohidrat: 3 menu (2 tinggi + 1 rendah)
      const karboTinggi = getRandomBySpecificCategory(kaloriTinggi, "karbohidrat", 2);
      const karboRendah = getRandomBySpecificCategory(kaloriRendah, "karbohidrat", 1);
      
      // Protein: 3 menu (3 tinggi)
      const proteinTinggi = getRandomBySpecificCategory(kaloriTinggi, "protein", 3);
      
      // Serat: 2 menu (1 tinggi + 1 rendah)
      const seratTinggi = getRandomBySpecificCategory(kaloriTinggi, "serat", 1);
      const seratRendah = getRandomBySpecificCategory(kaloriRendah, "serat", 1);
      
      // Camilan: 2 menu (1 tinggi + 1 rendah)
      const cemilanTinggi = getRandomBySpecificCategory(kaloriTinggi, "camilan", 1);
      const cemilanRendah = getRandomBySpecificCategory(kaloriRendah, "camilan", 1);
      
      result = [
        ...karboTinggi,      // 2 tinggi
        ...karboRendah,      // 1 rendah
        ...proteinTinggi,    // 3 tinggi
        ...seratTinggi,      // 1 tinggi
        ...seratRendah,      // 1 rendah
        ...cemilanTinggi,    // 1 tinggi
        ...cemilanRendah     // 1 rendah
      ];
      // Total: 7 tinggi (2+3+1+1) + 3 rendah (1+1+1) = 10 menu
      
      // Verifikasi dan lengkapi jika kurang
      const usedNames = result.map(item => item.nilai["Nama Makanan"]);
      const highCount = result.filter(item => item.nilai["Kalori Tinggi"] === "Ya").length;
      const lowCount = result.filter(item => item.nilai["Kalori Tinggi"] === "Tidak").length;
      
      // Jika kurang dari target, tambahkan
      if (highCount < 7) {
        const needed = 7 - highCount;
        const additionalHigh = kaloriTinggi
          .filter(item => !usedNames.includes(item.nilai["Nama Makanan"]))
          .slice(0, needed);
        result = [...result, ...additionalHigh];
      } else if (highCount > 7) {
        // Jika lebih, kurangi
        const toRemove = highCount - 7;
        const highItems = result.filter(item => item.nilai["Kalori Tinggi"] === "Ya");
        result = result.filter(item => !highItems.slice(-toRemove).includes(item));
      }
      
      if (lowCount < 3 && result.length < 10) {
        const needed = Math.min(3 - lowCount, 10 - result.length);
        const currentNames = result.map(item => item.nilai["Nama Makanan"]);
        const additionalLow = kaloriRendah
          .filter(item => !currentNames.includes(item.nilai["Nama Makanan"]))
          .slice(0, needed);
        result = [...result, ...additionalLow];
      }
      
    } else if (kategoriPasien === "Defisit Kalori") {
      // Untuk defisit kalori: 10 makanan rendah kalori
      const kaloriRendah = makanan.filter((item) => item.nilai["Kalori Tinggi"] === "Tidak");
      
      // Karbohidrat: 3 rendah kalori
      const karbo = getRandomBySpecificCategory(kaloriRendah, "karbohidrat", 3);
      
      // Protein: 3 rendah kalori
      const protein = getRandomBySpecificCategory(kaloriRendah, "protein", 3);
      
      // Serat: 2 rendah kalori
      const serat = getRandomBySpecificCategory(kaloriRendah, "serat", 2);
      
      // Camilan: 2 rendah kalori
      const cemilan = getRandomBySpecificCategory(kaloriRendah, "camilan", 2);
      
      result = [...karbo, ...protein, ...serat, ...cemilan];
      
      // Jika kurang dari 10, tambahkan dari makanan rendah kalori lainnya
      if (result.length < 10) {
        const remaining = 10 - result.length;
        const usedNames = result.map(item => item.nilai["Nama Makanan"]);
        const additionalLow = kaloriRendah
          .filter(item => !usedNames.includes(item.nilai["Nama Makanan"]))
          .slice(0, remaining);
        result = [...result, ...additionalLow];
      }
      
    } else if (kategoriPasien === "Kalori Normal") {
      // Untuk kalori normal: 5 makanan tinggi kalori + 5 makanan rendah kalori
      const kaloriTinggi = makanan.filter((item) => item.nilai["Kalori Tinggi"] === "Ya");
      const kaloriRendah = makanan.filter((item) => item.nilai["Kalori Tinggi"] === "Tidak");
      
      // Karbohidrat: 2 tinggi + 1 rendah = 3
      const karboTinggi = getRandomBySpecificCategory(kaloriTinggi, "karbohidrat", 2);
      const karboRendah = getRandomBySpecificCategory(kaloriRendah, "karbohidrat", 1);
      
      // Protein: 2 tinggi + 2 rendah = 4
      const proteinTinggi = getRandomBySpecificCategory(kaloriTinggi, "protein", 2);
      const proteinRendah = getRandomBySpecificCategory(kaloriRendah, "protein", 2);
      
      // Serat: 1 tinggi + 1 rendah = 2
      const seratTinggi = getRandomBySpecificCategory(kaloriTinggi, "serat", 1);
      const seratRendah = getRandomBySpecificCategory(kaloriRendah, "serat", 1);
      
      // Camilan: 0 tinggi + 1 rendah = 1 (akan di-adjust)
      const cemilanRendah = getRandomBySpecificCategory(kaloriRendah, "camilan", 1);
      
      result = [...karboTinggi, ...karboRendah, ...proteinTinggi, ...proteinRendah, ...seratTinggi, ...seratRendah, ...cemilanRendah];
      
      // Verifikasi dan adjust ke 5 tinggi dan 5 rendah
      const highCount = result.filter(item => item.nilai["Kalori Tinggi"] === "Ya").length;
      const lowCount = result.filter(item => item.nilai["Kalori Tinggi"] === "Tidak").length;
      
      const usedNames = result.map(item => item.nilai["Nama Makanan"]);
      
      if (highCount < 5) {
        const needed = 5 - highCount;
        const additionalHigh = kaloriTinggi
          .filter(item => !usedNames.includes(item.nilai["Nama Makanan"]))
          .slice(0, needed);
        result = [...result, ...additionalHigh];
        usedNames.push(...additionalHigh.map(item => item.nilai["Nama Makanan"]));
      }
      
      if (lowCount < 5) {
        const needed = 5 - lowCount;
        const additionalLow = kaloriRendah
          .filter(item => !usedNames.includes(item.nilai["Nama Makanan"]))
          .slice(0, needed);
        result = [...result, ...additionalLow];
      }
    }
    
    // Filter hasil yang valid dan batasi maksimal 10
    const finalResult = result.filter(item => item && item.nilai).slice(0, 10);
    
    return finalResult;
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

                    {/* Saran Makanan Per Pasien - Untuk semua kategori */}
                    {hasilAkhirPasien.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-white font-semibold text-base sm:text-lg">
                          🍽️ Saran Makanan Per Pasien
                        </h4>
                        
                        {hasilAkhirPasien.map((pasien, index) => {
                          const rekomendasiMakanan = getRekomendasiMakanan(pasien.kategori);
                          
                          return (
                            <div
                              key={index}
                              className={`bg-white/5 rounded-lg p-4 border-l-4 ${
                                pasien.kategori === "Surplus Kalori"
                                  ? "border-blue-500"
                                  : pasien.kategori === "Defisit Kalori"
                                  ? "border-orange-500"
                                  : "border-green-500"
                              }`}
                            >
                              {/* Header Pasien */}
                              <div className="mb-4 flex items-start justify-between">
                                <div>
                                  <h5 className="text-white font-semibold text-base mb-2">
                                    {pasien.namaPasien}
                                  </h5>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        pasien.kategori === "Surplus Kalori"
                                          ? "bg-blue-500/20 text-blue-400"
                                          : pasien.kategori === "Defisit Kalori"
                                          ? "bg-orange-500/20 text-orange-400"
                                          : "bg-green-500/20 text-green-400"
                                      }`}
                                    >
                                      {pasien.kategori}
                                    </span>
                                    <span className="text-white/60 text-xs">
                                      {pasien.kategori === "Surplus Kalori"
                                        ? "🔼 Tambah Kalori"
                                        : pasien.kategori === "Defisit Kalori"
                                        ? "🔽 Kurangi Kalori"
                                        : "⚖️ Pertahankan"}
                                    </span>
                                  </div>
                                </div>

                                {/* Tombol Cetak di sebelah kanan header pasien */}
                                <div className="ml-4">
                                  <button
                                    onClick={() => {
                                      const rekomendasiMakanan = getRekomendasiMakanan(pasien.kategori);
                                      navigate(`/cetak/${pasien.id}`, {
                                        state: {
                                          rekomendasiMakanan: rekomendasiMakanan.map(item => ({
                                            namaMakanan: item.nilai["Nama Makanan"],
                                            kategori: item.nilai["Kategori Makanan"],
                                            kalori: item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah",
                                            jumlahKalori: item.nilai["Jumlah Kalori"]
                                          }))
                                        }
                                      });
                                    }}
                                    className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md ring-1 ring-white/10 transition-transform transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    aria-label={`Cetak laporan ${pasien.namaPasien}`}
                                  >
                                    <FaPrint className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="leading-none">Cetak</span>
                                  </button>
                                </div>
                              </div>

                              {/* Rekomendasi Makanan */}
                              {rekomendasiMakanan.length > 0 ? (
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-white/70 text-sm font-medium">
                                      Rekomendasi Makanan (10 Menu):
                                    </p>
                                    {/* Summary Counter */}
                                    <div className="flex gap-2">
                                      <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-semibold">
                                        Tinggi: {rekomendasiMakanan.filter(item => item.nilai["Kalori Tinggi"] === "Ya").length}
                                      </span>
                                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-semibold">
                                        Rendah: {rekomendasiMakanan.filter(item => item.nilai["Kalori Tinggi"] === "Tidak").length}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Group makanan by kategori */}
                                  {(() => {
                                    const groupedByCategory = {
                                      karbohidrat: [],
                                      protein: [],
                                      serat: [],
                                      camilan: [],
                                      lainnya: []
                                    };

                                    rekomendasiMakanan.forEach(item => {
                                      const kategori = item.nilai["Kategori Makanan"]?.toLowerCase() || "";
                                      if (kategori.includes("karbohidrat")) {
                                        groupedByCategory.karbohidrat.push(item);
                                      } else if (kategori.includes("protein")) {
                                        groupedByCategory.protein.push(item);
                                      } else if (kategori.includes("serat") || kategori.includes("buah") || kategori.includes("sayur")) {
                                        groupedByCategory.serat.push(item);
                                      } else if (kategori.includes("camilan") || kategori.includes("minuman") || kategori.includes("snack")) {
                                        groupedByCategory.camilan.push(item);
                                      } else {
                                        groupedByCategory.lainnya.push(item);
                                      }
                                    });

                                    return (
                                      <div className="space-y-4">
                                        {/* Karbohidrat */}
                                        {groupedByCategory.karbohidrat.length > 0 && (
                                          <div>
                                            <h6 className="text-yellow-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🍚 Karbohidrat ({groupedByCategory.karbohidrat.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.karbohidrat.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-yellow-500/20"
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

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
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
                                          </div>
                                        )}

                                        {/* Protein */}
                                        {groupedByCategory.protein.length > 0 && (
                                          <div>
                                            <h6 className="text-purple-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🥩 Protein ({groupedByCategory.protein.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.protein.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-purple-500/20"
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

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
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
                                          </div>
                                        )}

                                        {/* Serat / Sayuran & Buah */}
                                        {groupedByCategory.serat.length > 0 && (
                                          <div>
                                            <h6 className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🥗 Serat / Sayur & Buah ({groupedByCategory.serat.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.serat.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-green-500/20"
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

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}
                                                  
                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
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
                                          </div>
                                        )}

                                        {/* Camilan */}
                                        {groupedByCategory.camilan.length > 0 && (
                                          <div>
                                            <h6 className="text-orange-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🍪 Camilan ({groupedByCategory.camilan.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.camilan.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-orange-500/20"
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

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}
                                                  
                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Konsumsi Secukupnya / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
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
                                          </div>
                                        )}

                                        {/* Lainnya (jika ada) */}
                                        {groupedByCategory.lainnya.length > 0 && (
                                          <div>
                                            <h6 className="text-gray-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🍽️ Lainnya ({groupedByCategory.lainnya.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.lainnya.map((item, idx) => (
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

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}
                                                  
                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
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
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Catatan */}
                                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                                    <p className="text-white/60 text-xs leading-relaxed">
                                      💡 {pasien.kategori === "Surplus Kalori"
                                        ? "Menu terdiri dari 6 makanan tinggi kalori dan 3 makanan rendah kalori (total 10 menu) yang dipilih dari berbagai kategori untuk meningkatkan asupan kalori secara optimal."
                                        : pasien.kategori === "Defisit Kalori"
                                        ? "Menu terdiri dari 10 makanan rendah kalori yang dipilih dari berbagai kategori untuk membantu mengurangi asupan kalori harian secara efektif."
                                        : "Menu terdiri dari 5 makanan tinggi kalori dan 5 makanan rendah kalori (total 10 menu) yang seimbang dari berbagai kategori untuk menjaga asupan kalori tetap normal."}
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