// import { Link, useLocation } from "react-router-dom";
// import { Dna } from "lucide-react";
// import logo from "/favicon.png";

// const Header = () => {
//   const location = useLocation();
  
//   const isActiveDashboard = (path) => {
//     return location.pathname === path && path !== "/";
//   };

//   return (
//     <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-blue-100">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             {/* <div className="bg-blue-600 p-2 rounded-lg"> */}
//               <Dna className="h-6 w-6 text-white" />
//               <img src={logo} alt="TCNA logo" className="h-16 w-16" />
//             {/* </div> */}
//             <Link to="/" className="text-2xl font-bold text-blue-900">
//               TCNA - The Cancer Noise Atlas
//             </Link>
//           </div>
//           <nav className="flex space-x-6">
//             <Link
//             to="/gene-analysis"
//             className={`text-blue-700 hover:text-blue-600 transition-colors ${
//                 isActiveDashboard("/gene-analysis") || isActiveDashboard("/gene-results")
//                 ? "font-bold"
//                 : "font-medium"
//             }`}
//             >
//             Gene Analysis
//             </Link>

//             <Link
//               to="/pathway-analysis"
//               className={`text-blue-700 hover:text-blue-600 transition-colors ${
//                 isActiveDashboard("/pathway-analysis") || isActiveDashboard("/pathway-results")
//                   ? "font-bold"
//                   : "font-medium"
//               }`}
//             >
//               Pathway Analysis
//             </Link>
//             <Link
//               to="/tumour-analysis"
//               className={`text-blue-700 hover:text-blue-600 transition-colors ${
//                 isActiveDashboard("/tumour-analysis") || isActiveDashboard("/tumor-analysis-results")
//                   ? "font-bold"
//                   : "font-medium"
//               }`}
//             >
//               Tumor Analysis
//             </Link>
//           </nav>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
import { Link, useLocation } from "react-router-dom";
import { Dna } from "lucide-react";
import logo from "/favicon.png";

const Header = () => {
  const location = useLocation();
  
  const isActiveDashboard = (path) => {
    return location.pathname === path && path !== "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-blue-950 shadow-md border-b border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* <div className="bg-blue-800 p-3 rounded-lg"> */}
            <Link to="/">
              <img src={logo} alt="TCNA logo" className="h-16 w-16" />
              </Link>
              {/* <Dna className="h-7 w-7 text-white" /> */}
            {/* </div> */}
            <Link to="/" className={` transition-colors text-2xl font-extrabold ${
                isActiveDashboard("/") || isActiveDashboard("/")
                  ? "text-blue-900"
                  : "text-white hover:text-blue-100"
              }`}
              >
              TCNA - The Cancer Noise Atlas
            </Link>
          </div>
          <nav className="flex space-x-8">
            <Link
              to="/gene-analysis"
              className={`text-white hover:text-blue-100 transition-colors  ${
                isActiveDashboard("/gene-analysis") || isActiveDashboard("/gene-results")
                  ? "font-extrabold"
                  : "font-small"
              }`}
            >
              Gene Analysis
            </Link>

            <Link
              to="/pathway-analysis"
              className={`text-white hover:text-blue-100 transition-colors ${
                isActiveDashboard("/pathway-analysis") || isActiveDashboard("/pathway-results")
                  ? "font-extrabold"
                  : "font-small"
              }`}
            >
              Pathway Analysis
            </Link>
            <Link
              to="/tumour-analysis"
              className={`text-white hover:text-blue-100 transition-colors ${
                isActiveDashboard("/tumour-analysis") || isActiveDashboard("/tumor-analysis-results")
                  ? "font-extrabold"
                  : "font-small"
              }`}
            >
              Tumor Analysis
            </Link>
            <Link
              to="/upload-analysis"
              className={`text-white hover:text-blue-100 transition-colors ${
                isActiveDashboard("/upload-analysis") || isActiveDashboard("/upload-analysis")
                  ? "font-extrabold"
                  : "font-small"
              }`}
            >
              Custom Data Analysis
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
