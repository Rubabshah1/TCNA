import { Link, useLocation } from "react-router-dom";
import { Dna } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  const isActiveDashboard = (path) => {
    return location.pathname === path && path !== "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Dna className="h-6 w-6 text-white" />
            </div>
            <Link to="/" className="text-2xl font-bold text-blue-900">
              TCNA - The Cancer Noise Atlas
            </Link>
          </div>
          <nav className="flex space-x-6">
            <Link
              to="/gene-analysis"
              className={`text-blue-700 hover:text-blue-600 font-medium transition-colors ${
                isActiveDashboard("/gene-analysis") ? "text-blue-800" : ""
              }`}
            >
              Gene Analysis
            </Link>
            <Link
              to="/pathway-analysis"
              className={`text-blue-700 hover:text-blue-600 font-medium transition-colors ${
                isActiveDashboard("/pathway-analysis") ? "text-blue-800" : ""
              }`}
            >
              Pathway Analysis
            </Link>
            <Link
              to="/tumour-analysis"
              className={`text-blue-700 hover:text-blue-600 font-medium transition-colors ${
                isActiveDashboard("/tumour-analysis") ? "text-blue-800" : ""
              }`}
            >
              Tumor Analysis
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;