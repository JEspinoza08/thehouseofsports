import Header from "../components/Header";
import Brands from "../components/Brands";
import Footer from "../components/Footer";

export default function Marcas() {
  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={() => {}} />

      <Brands />

      <Footer />
    </div>
  );
}