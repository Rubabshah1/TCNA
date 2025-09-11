import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react"; // hamburger & close icons
import logo from "/favicon.png";

const Header = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActiveDashboard = (path) => {
    return location.pathname === path && path !== "/";
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 w-screen bg-blue-950 shadow-md border-b border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <Link to="/">
              <img src={logo} alt="TCNA logo" className="h-16 w-16" />
            </Link>
            <Link
              to="/"
              className={`transition-colors text-2xl font-extrabold ${
                isActiveDashboard("/") ? "text-blue-900" : "text-white hover:text-blue-100"
              }`}
            >
              TCNA - The Cancer Noise Atlas
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-12">
            <Link
              to="/gene-analysis"
              className={`text-white hover:text-blue-100 transition-colors ${
                isActiveDashboard("/gene-analysis") || isActiveDashboard("/gene-results")
                  ? "font-extrabold"
                  : "font-medium"
              }`}
            >
              Gene
            </Link>
            <Link
              to="/pathway-analysis"
              className={`text-white hover:text-blue-100 transition-colors ${
                isActiveDashboard("/pathway-analysis") || isActiveDashboard("/pathway-results")
                  ? "font-extrabold"
                  : "font-medium"
              }`}
            >
              Pathway
            </Link>
            <Link
              to="/tumour-analysis"
              className={`text-white hover:text-blue-100 transition-colors ${
                isActiveDashboard("/tumour-analysis") || isActiveDashboard("/tumor-analysis-results")
                  ? "font-extrabold"
                  : "font-medium"
              }`}
            >
              Tumor
            </Link>
            <Link
              to="/upload-analysis"
              className={`text-white hover:text-blue-100 transition-colors ${
                isActiveDashboard("/upload-analysis") || isActiveDashboard("/upload-results")
                  ? "font-extrabold"
                  : "font-medium"
              }`}
            >
              Custom Data
            </Link>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Collapsible Menu */}
        {menuOpen && (
          <nav className="mt-4 flex flex-col space-y-4 md:hidden">
            <Link
              to="/gene-analysis"
              className="text-white hover:text-blue-100 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Gene
            </Link>
            <Link
              to="/pathway-analysis"
              className="text-white hover:text-blue-100 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Pathway
            </Link>
            <Link
              to="/tumour-analysis"
              className="text-white hover:text-blue-100 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Tumor
            </Link>
            <Link
              to="/upload-analysis"
              className="text-white hover:text-blue-100 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Custom Data
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
// import { Link, useLocation } from "react-router-dom";
// import logo from "/favicon.png";

// const Header = () => {
//   const location = useLocation();
  
//   const isActiveDashboard = (path) => {
//     return location.pathname === path && path !== "/";
//   };

//   return (
//     // className="fixed top-0 left-0 w-full z-10 bg-blue-900/90"
//     // className="sticky top-0 z-50 bg-blue-950 shadow-md border-b border-blue-900"
//     <header className="sticky w-full top-0 z-50 bg-blue-950 shadow-md border-b border-blue-900">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             {/* <div className="bg-blue-800 p-3 rounded-lg"> */}
//             <Link to="/">
//               <img src={logo} alt="TCNA logo" className="h-16 w-16" />
//               </Link>
//               {/* <Dna className="h-7 w-7 text-white" /> */}
//             {/* </div> */}
//             <Link to="/" className={` transition-colors text-2xl font-extrabold ${
//                 isActiveDashboard("/") || isActiveDashboard("/")
//                   ? "text-blue-900"
//                   : "text-white hover:text-blue-100"
//               }`}
//               >
//               TCNA - The Cancer Noise Atlas
//             </Link>
//           </div>
//           <nav className="flex space-x-12">
//             <Link
//               to="/gene-analysis"
//               className={`text-white hover:text-blue-100 transition-colors   ${
//                 isActiveDashboard("/gene-analysis") || isActiveDashboard("/gene-results")
//                   ? "font-extrabold"
//                   : "font-xl"
//               }`}
//             >
//               Gene      
//             </Link>

//             <Link
//               to="/pathway-analysis"
//               className={`text-white hover:text-blue-100 transition-colors ${
//                 isActiveDashboard("/pathway-analysis") || isActiveDashboard("/pathway-results")
//                   ? "font-extrabold"
//                   : "font-medium"
//               }`}
//             >
//               Pathway       
//             </Link>
//             <Link
//               to="/tumour-analysis"
//               className={`text-white hover:text-blue-100 transition-colors ${
//                 isActiveDashboard("/tumour-analysis") || isActiveDashboard("/tumor-analysis-results")
//                   ? "font-extrabold"
//                   : "font-medium"
//               }`}
//             >
//               Tumor    
//             </Link>
//             <Link
//               to="/upload-analysis"
//               className={`text-white hover:text-blue-100 transition-colors ${
//                 isActiveDashboard("/upload-analysis") || isActiveDashboard("/upload-results")
//                   ? "font-extrabold"
//                   : "font-medium"
//               }`}
//             >
//               Custom Data
//             </Link>
//           </nav>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
