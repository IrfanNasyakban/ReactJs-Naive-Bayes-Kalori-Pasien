
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import {
  FaCalculator,
  FaSave,
  FaChartLine,
  FaTable,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const PerhitunganMakanan = () => {
  const [kriteriaMakanan, setKriteriaMakanan] = useState([]);
  const [datasetMakanan, setDatasetMakanan] = useState([]);
  const [hasilPerhitungan, setHasilPerhitungan] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getKriteriaMakanan();
      getDatasetMakanan();
    } else {
      navigate("/");
    }
  }, [navigate]);

  const getKriteriaMakanan = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/kriteria-makanan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setKriteriaMakanan(response.data);
    } catch (error) {
      console.error("Error fetching kriteria Makanan:", error);
    }
  };

  const getDatasetMakanan = async () => {
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
      setDatasetMakanan(response.data);
    } catch (error) {
      console.error("Error fetching dataset Makanan:", error);
    }
  };

  // Fungsi untuk menghitung Naive Bayes
  const calculateNaiveBayes = (dataset, kriteria) => {
    // Filter kriteria untuk mendapatkan atribut (exclude "Main")
    const excludes = ["Nama Makanan", "Kategori Makanan", "Kategori"];

    const atribut = kriteria
      .filter((k) => !excludes.includes(k.namaKriteria))
      .map((k) => k.namaKriteria);

    // 1. Hitung Probabilitas Kelas
    const totalData = dataset.length;
    const countBoleh = dataset.filter(
      (item) => item.nilai?.Kategori === "Boleh"
    ).length;
    const countTidakBoleh = dataset.filter(
      (item) => item.nilai?.Kategori === "Tidak Boleh"
    ).length;

    const probabilitasKelas = {
      Boleh: countBoleh / totalData,
      TidakBoleh: countTidakBoleh / totalData,
    };

    // 2. Hitung Probabilitas Atribut untuk setiap atribut
    const probabilitasAtribut = {};

    atribut.forEach((attr) => {
      probabilitasAtribut[attr] = {
        Boleh: {},
        TidakBoleh: {},
      };

      // Get unique values for this attribute
      const uniqueValues = [
        ...new Set(dataset.map((item) => item.nilai?.[attr])),
      ].filter(Boolean);

      uniqueValues.forEach((value) => {
        // Count occurrences for "Boleh" class
        const countBolehAttr = dataset.filter(
          (item) =>
            item.nilai?.Kategori === "Boleh" && item.nilai?.[attr] === value
        ).length;

        // Count occurrences for "Tidak Boleh" class
        const countTidakBolehAttr = dataset.filter(
          (item) =>
            item.nilai?.Kategori === "Tidak Boleh" &&
            item.nilai?.[attr] === value
        ).length;

        // Calculate probabilities
        probabilitasAtribut[attr].Boleh[value] =
          countBoleh > 0 ? countBolehAttr / countBoleh : 0;
        probabilitasAtribut[attr].TidakBoleh[value] =
          countTidakBoleh > 0 ? countTidakBolehAttr / countTidakBoleh : 0;
      });
    });

    // 3. Prediksi untuk setiap data
    const prediksi = dataset.map((item, index) => {
      const kategoriAktual = item.nilai?.Kategori;

      // Calculate posterior probabilities
      let probBoleh = probabilitasKelas.Boleh;
      let probTidakBoleh = probabilitasKelas.TidakBoleh;

      // Apply Laplace smoothing if probability is 0
      const smoothing = 0.001;

      // Multiply probabilities for each attribute
      atribut.forEach((attr) => {
        const value = item.nilai?.[attr];
        if (value) {
          probBoleh *= probabilitasAtribut[attr].Boleh[value] || smoothing;
          probTidakBoleh *=
            probabilitasAtribut[attr].TidakBoleh[value] || smoothing;
        }
      });

      const klasifikasi = probBoleh > probTidakBoleh ? "Boleh" : "Tidak Boleh";
      const prediksiSesuai =
        klasifikasi === kategoriAktual ? "SESUAI" : "TIDAK SESUAI";

      return {
        no: index + 1,
        data: item.nilai,
        kategoriAktual,
        probBoleh,
        probTidakBoleh,
        klasifikasi,
        prediksiSesuai,
      };
    });

    return {
      probabilitasKelas,
      probabilitasAtribut,
      prediksi,
      atribut,
    };
  };

  const handleHitungKlasifikasi = () => {
    console.log("Memulai perhitungan klasifikasi Naive Bayes...");

    // Hitung untuk dataset makanan
    const hasilMakanan = calculateNaiveBayes(datasetMakanan, kriteriaMakanan);

    // Buat hasil akhir dari prediksi klasifikasi
    const hasilAkhir = hasilMakanan.prediksi.map((pred) => {
      // Ambil nama makanan dari data nilai
      const namaMakanan = pred.data["Nama Makanan"] || "";

      // Ambil kategori dari hasil klasifikasi (bukan kategori aktual)
      const kategori = pred.klasifikasi; // Ini akan berisi "Boleh" atau "Tidak Boleh"

      return {
        namaMakanan,
        kategori,
      };
    });

    setHasilPerhitungan({
      makanan: hasilMakanan,
      hasilAkhir,
    });
  };

  const saveHasilAkhirToDatabase = async () => {
    if (!hasilPerhitungan || !hasilPerhitungan.hasilAkhir) {
      alert("Tidak ada data hasil akhir untuk disimpan.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const hasilAkhirData = hasilPerhitungan.hasilAkhir.map((item) => ({
        namaMakanan: item.namaMakanan,
        kategori: item.kategori,
      }));

      await axios.delete(
        "http://localhost:5000/hasil-akhir-makanan?confirm=true",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await axios.post(
        "http://localhost:5000/hasil-akhir-makanan",
        {
          hasilAkhirMakanan: hasilAkhirData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Hasil akhir pasien berhasil disimpan ke database!");
    } catch (error) {
      console.error("Error saving rangking:", error);
      alert(
        `Error menyimpan akhir pasien: ${
          error.response?.data?.msg || error.message
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.2),transparent_50%)]"></div>
      </div>

      {/* Floating Elements - Hidden on mobile */}
      <div className="hidden md:block absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Main Content - Added responsive padding */}
      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Header - Responsive */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Sistem Klasifikasi Naive Bayes
            </h1>
            <p className="text-sm sm:text-base text-white/70">
              Analisis Kategori Makanan yang Boleh dan Tidak Boleh
            </p>
          </div>

          {/* Tabel Dataset - Mobile Responsive */}
          <div className="mb-6">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-blue-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                    <FaChartLine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                      Dataset Makanan yang boleh dan tidak boleh
                    </h2>
                    <p className="text-sm sm:text-base text-white/80">
                      Data yang akan digunakan untuk klasifikasi
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider min-w-[60px]">
                        No
                      </th>
                      {kriteriaMakanan.map((k) => (
                        <th
                          key={k.id}
                          className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider min-w-[120px]"
                        >
                          <div className="break-words">{k.namaKriteria}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {datasetMakanan.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap min-w-[60px]">
                          <span className="text-white font-medium text-sm sm:text-base">
                            {index + 1}
                          </span>
                        </td>
                        {kriteriaMakanan.map((kriteria) => (
                          <td
                            key={kriteria.id}
                            className="px-3 sm:px-6 py-3 sm:py-4 text-white/80 text-sm sm:text-base min-w-[120px]"
                          >
                            <div className="break-words">
                              {item.nilai
                                ? item.nilai[kriteria.namaKriteria] || "-"
                                : "-"}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Button Hitung Klasifikasi - Responsive */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleHitungKlasifikasi}
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl shadow-xl shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-md sm:rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                  <FaCalculator className="w-3 h-3 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="text-sm sm:text-lg">Hitung Klasifikasi Naive Bayes</span>
              </div>
            </button>
          </div>

          {/* Hasil Perhitungan - Responsive */}
          {hasilPerhitungan && (
            <>
              {/* Hasil Perhitungan Dataset */}
              <div className="mb-6">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600/80 via-orange-600/80 to-yellow-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      Hasil Perhitungan Dataset Makanan
                    </h2>
                  </div>

                  {/* Probabilitas Kelas - Mobile Grid */}
                  <div className="p-4 sm:p-6 border-b border-white/10">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                      Probabilitas Kelas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                        <p className="text-white/70 text-sm sm:text-base">Status: Boleh</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-400">
                          {hasilPerhitungan.makanan.probabilitasKelas.Boleh.toFixed(2)}
                          <span className="text-sm sm:text-lg ml-2">
                            (
                            {(
                              hasilPerhitungan.makanan.probabilitasKelas.Boleh * 100
                            ).toFixed(0)}
                            %)
                          </span>
                        </p>
                        <p className="text-xs sm:text-sm text-white/60 mt-2">
                          Jumlah:{" "}
                          {
                            datasetMakanan.filter(
                              (item) => item.nilai?.Kategori === "Boleh"
                            ).length
                          }{" "}
                          data
                        </p>
                      </div>
                      <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                        <p className="text-white/70 text-sm sm:text-base">Status: Tidak Boleh</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-400">
                          {hasilPerhitungan.makanan.probabilitasKelas.TidakBoleh.toFixed(2)}
                          <span className="text-sm sm:text-lg ml-2">
                            (
                            {(
                              hasilPerhitungan.makanan.probabilitasKelas.TidakBoleh * 100
                            ).toFixed(0)}
                            %)
                          </span>
                        </p>
                        <p className="text-xs sm:text-sm text-white/60 mt-2">
                          Jumlah:{" "}
                          {
                            datasetMakanan.filter(
                              (item) => item.nilai?.Kategori === "Tidak Boleh"
                            ).length
                          }{" "}
                          data
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Probabilitas Atribut - Mobile Responsive Table */}
                  <div className="p-4 sm:p-6 border-b border-white/10">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                      Tabel Kategori/Atribut
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-2 sm:px-4 py-2 text-left text-white/70 text-xs sm:text-sm min-w-[120px]">
                              Kategori/Atribut
                            </th>
                            <th className="px-2 sm:px-4 py-2 text-left text-white/70 text-xs sm:text-sm min-w-[100px]">
                              Subset
                            </th>
                            <th className="px-2 sm:px-4 py-2 text-center text-white/70 text-xs sm:text-sm min-w-[80px]">
                              Boleh
                            </th>
                            <th className="px-2 sm:px-4 py-2 text-center text-white/70 text-xs sm:text-sm min-w-[100px]">
                              Tidak Boleh
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {Object.entries(
                            hasilPerhitungan.makanan.probabilitasAtribut
                          ).map(([attr, values]) => {
                            const sortedSubsets = Object.entries(values.Boleh).sort((a, b) => {
                              if (a[0] === "Ya" && b[0] === "Tidak") return -1;
                              if (a[0] === "Tidak" && b[0] === "Ya") return 1;
                              return 0;
                            });

                            return sortedSubsets.map((subset, index) => (
                              <tr
                                key={`${attr}-${subset[0]}`}
                                className="hover:bg-white/5"
                              >
                                <td className="px-2 sm:px-4 py-2 text-white/80 text-xs sm:text-sm">
                                  <div className="break-words">
                                    {index === 0 ? attr : ""}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2 text-white/80 text-xs sm:text-sm">
                                  {subset[0]}
                                </td>
                                <td className="px-2 sm:px-4 py-2 text-center text-white/80 text-xs sm:text-sm">
                                  {subset[1].toFixed(3)}
                                </td>
                                <td className="px-2 sm:px-4 py-2 text-center text-white/80 text-xs sm:text-sm">
                                  {values.TidakBoleh[subset[0]]?.toFixed(3) || "0.000"}
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabel Pembuktian - Mobile Responsive */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                      Tabel Pembuktian Prediksi
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-2 sm:px-3 py-2 text-left text-white/70 text-xs min-w-[40px]">
                              No
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-left text-white/70 text-xs min-w-[80px]">
                              Boleh
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-left text-white/70 text-xs min-w-[100px]">
                              Tidak Boleh
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-left text-white/70 text-xs min-w-[80px]">
                              Fakta
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-left text-white/70 text-xs min-w-[90px]">
                              Klasifikasi
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-left text-white/70 text-xs min-w-[80px]">
                              Prediksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {hasilPerhitungan.makanan.prediksi.map((pred) => (
                            <tr key={pred.no} className="hover:bg-white/5">
                              <td className="px-2 sm:px-3 py-2 text-white/80 text-xs sm:text-sm">
                                {pred.no}
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-white/80 text-xs sm:text-sm">
                                {pred.probBoleh.toFixed(6)}
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-white/80 text-xs sm:text-sm">
                                {pred.probTidakBoleh.toFixed(6)}
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-white/80 text-xs sm:text-sm">
                                {pred.kategoriAktual}
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-white/80 text-xs sm:text-sm">
                                {pred.klasifikasi}
                              </td>
                              <td className="px-2 sm:px-3 py-2">
                                <span
                                  className={`px-1 sm:px-2 py-1 rounded text-xs font-semibold ${
                                    pred.prediksiSesuai === "SESUAI"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {pred.prediksiSesuai}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hasil Akhir Klasifikasi - Mobile Responsive */}
              <div className="mb-6">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-rose-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                        <FaTable className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                          Hasil Akhir Klasifikasi Makanan
                        </h2>
                        <p className="text-sm sm:text-base text-white/80">
                          Perbandingan hasil prediksi makanan boleh dan tidak boleh
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
                              Makanan
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
                          {hasilPerhitungan.hasilAkhir.map((hasil, index) => (
                            <tr
                              key={index}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-white/90 font-medium text-sm sm:text-base">
                                <div className="break-words">{hasil.namaMakanan}</div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <span
                                  className={`px-1 sm:px-3 py-1 rounded-full text-xs sm:text-xs font-semibold ${
                                    hasil.kategori === "Boleh"
                                      ? "bg-green-500/20 text-green-400 border border-green-400/30"
                                      : "bg-orange-500/20 text-orange-400 border border-orange-400/30"
                                  }`}
                                >
                                  {hasil.kategori}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                {hasil.kategori === "Tidak Boleh" ? (
                                  <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mx-auto" />
                                ) : (
                                  <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mx-auto" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Statistics - Mobile Grid */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 sm:p-4">
                        <p className="text-orange-400 text-sm">Total Boleh</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">
                          {
                            hasilPerhitungan.hasilAkhir.filter(
                              (h) => h.kategori === "Boleh"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 sm:p-4">
                        <p className="text-blue-400 text-sm">Total Tidak Boleh</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">
                          {
                            hasilPerhitungan.hasilAkhir.filter(
                              (h) => h.kategori === "Tidak Boleh"
                            ).length
                          }
                        </p>
                      </div>
                    </div>

                    {/* Button Simpan Hasil - Responsive */}
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={saveHasilAkhirToDatabase}
                        className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl shadow-xl shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="relative flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-md sm:rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                            <FaSave className="w-3 h-3 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200" />
                          </div>
                          <span className="text-sm sm:text-lg">
                            Simpan Hasil Klasifikasi
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerhitunganMakanan;
