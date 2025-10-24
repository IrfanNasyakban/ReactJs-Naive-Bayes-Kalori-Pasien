import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { Navbar, Footer, Sidebar } from "./components";
import { Dashboard, LoginPage, ListKriteriaPasien, AddKriteriaDefisit, AddKriteriaSurplus, EditKriteriaDefisit, EditKriteriaSurplus, ListDatasetPasien, AddDatasetDefisit, EditDatasetDefisit, AddDatasetSurplus, EditDatasetSurplus, PerhitunganPasien, HasilAkhirPasien, ListKriteriaMakanan, AddKriteriaMakanan, EditKriteriaMakanan, ListDatasetMakanan, AddDatasetMakanan, EditDatasetMakanan, PerhitunganMakanan, HasilAkhirMakanan } from "./pages";

import { useStateContext } from "./contexts/ContextProvider";

import "./App.css";

const AppContent = () => {
  const { activeMenu, screenSize, currentMode } = useStateContext();
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  // Toggle class body-no-scroll for mobile
  useEffect(() => {
    // Only apply body-no-scroll on mobile when sidebar is open
    if (activeMenu && screenSize && screenSize <= 900) {
      document.body.classList.add("body-no-scroll");
    } else {
      document.body.classList.remove("body-no-scroll");
    }

    return () => {
      document.body.classList.remove("body-no-scroll");
    };
  }, [activeMenu, screenSize]);

  // Determine if we should apply sidebar margin (only on desktop)
  const shouldApplySidebarMargin = !isLoginPage && activeMenu && screenSize && screenSize > 900;

  return (
    <div className={currentMode === "Dark" ? "dark" : ""}>
      <div className="flex relative dark:bg-main-dark-bg">

        {/* Sidebar - Always render the component but let it handle its own visibility */}
        {!isLoginPage && <Sidebar />}

        {/* Main Content */}
        <div
          className={`main-content dark:bg-main-dark-bg bg-main-bg min-h-screen w-full ${
            shouldApplySidebarMargin ? "sidebar-visible" : "full-width"
          }`}
        >
          {!isLoginPage && (
            <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
              <Navbar />
            </div>
          )}

          <div>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kriteria-pasien" element={<ListKriteriaPasien />} />
              <Route path="/add-kriteria-defisit" element={<AddKriteriaDefisit />} />
              <Route path="/add-kriteria-surplus" element={<AddKriteriaSurplus />} />
              <Route path="/edit-kriteria-defisit/:id" element={<EditKriteriaDefisit />} />
              <Route path="/edit-kriteria-surplus/:id" element={<EditKriteriaSurplus />} />
              <Route path="/dataset-pasien" element={<ListDatasetPasien />} />
              <Route path="/add-dataset-defisit" element={<AddDatasetDefisit />} />
              <Route path="/edit-dataset-defisit/:id" element={<EditDatasetDefisit />} />
              <Route path="/add-dataset-Surplus/" element={<AddDatasetSurplus />} />
              <Route path="/edit-dataset-surplus/:id" element={<EditDatasetSurplus />} />
              <Route path="/perhitungan-pasien" element={<PerhitunganPasien />} />
              <Route path="/hasil-pasien" element={<HasilAkhirPasien />} />
              <Route path="/kriteria-makanan" element={<ListKriteriaMakanan />} />
              <Route path="/add-kriteria-makanan" element={<AddKriteriaMakanan />} />
              <Route path="/edit-kriteria-makanan/:id" element={<EditKriteriaMakanan />} />
              <Route path="/dataset-makanan" element={<ListDatasetMakanan />} />
              <Route path="/add-dataset-makanan" element={<AddDatasetMakanan />} />
              <Route path="/edit-dataset-makanan/:id" element={<EditDatasetMakanan />} />
              <Route path="/perhitungan-makanan" element={<PerhitunganMakanan />} />
              <Route path="/hasil-makanan" element={<HasilAkhirMakanan />} />
            </Routes>
          </div>

          {!isLoginPage && <Footer />}
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;