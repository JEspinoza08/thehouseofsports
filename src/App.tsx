import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Guantes from "./pages/Guantes";
import Zapatillas from "./pages/Zapatillas";
import Accesorios from "./pages/Accesorios";
import Ropa from "./pages/Ropa";
import Ofertas from "./pages/Ofertas";
import Marcas from "./pages/Marcas";
import Contacto from "./pages/Contacto";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminManualSales from "./pages/admin/AdminManualSales";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminCategories from "./pages/admin/AdminCategories";
import DynamicCategory from "./pages/DynamicCategory";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import MyAccount from "./pages/auth/MyAccount";
import CheckoutPage from "./pages/CheckoutPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import About from "./pages/About";
import Faq from "./pages/Faq";
import ClaimsBook from "./pages/ClaimsBook";
import AdminProtectedRoute from "../src/components/AdminProtectedRoute";
import SiteMaintenanceGate from "./components/SiteMaintenanceGate";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCombos from "./pages/admin/AdminCombos";
import AdminAthletes from "./pages/admin/AdminAthletes";
import Athletes from "./pages/Athletes";
import AthletePost from "./pages/AthletePost";


function App() {
  return (
    <SiteMaintenanceGate>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/guantes" element={<Guantes />} />
      <Route path="/zapatillas" element={<Zapatillas />} />
      <Route path="/accesorios" element={<Accesorios />} />
      <Route path="/ropa" element={<Ropa />} />
      <Route path="/ofertas" element={<Ofertas />} />
      <Route path="/marcas" element={<Marcas />} />
      <Route path="/categoria/:slug" element={<DynamicCategory />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/atletas" element={<Athletes />} />
      <Route path="/atletas/:slug" element={<AthletePost />} />

      <Route path="/nosotros" element={<About />} />
      <Route path="/preguntas-frecuentes" element={<Faq />} />
      <Route path="/terminos-y-condiciones" element={<Terms />} />
      <Route path="/politica-de-privacidad" element={<Privacy />} />
      <Route path="/politica-de-envios" element={<Shipping />} />
      <Route path="/cambios-y-devoluciones" element={<Returns />} />
      <Route path="/libro-de-reclamaciones" element={<ClaimsBook />} />
      
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/mi-cuenta" element={<MyAccount />} />

      <Route path="/checkout" element={<CheckoutPage />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/products" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/manual-sales" element={<AdminManualSales />} />
        <Route path="/admin/banners" element={<AdminBanners />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/combos" element={<AdminCombos />} />
        <Route path="/admin/athletes" element={<AdminAthletes />} />
        <Route path="/admin/blog" element={<AdminBlog />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
    </Routes>
    </SiteMaintenanceGate>
  );
}

export default App;