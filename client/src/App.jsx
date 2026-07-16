// import { useEffect } from "react";
import { Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import ThemeToggle from "./Components/ThemeToggle";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  // useNavigate,
} from "react-router-dom";
import styled from "styled-components";
import ForgotPassword from "./Screens/ForgotPassword";
import { GlobalStyle } from "./Admin/GlobalStyle ";
const PublicRequirementForm = lazy(() =>
  import("./Client/PublicRequirementForm")
);
const PublicInvoice = lazy(() => import("./Client/PublicInvoice"));
const PublicProposal = lazy(() => import("./Client/PublicProposal"));
const Login = lazy(() => import("./Screens/Login"));
const RegisterAdmin = lazy(() => import("./Screens/RegisterAdmin"));
import PremiumLoader from "./Components/PremiumLoader";
const AdminRouter = lazy(() => import("./Routers/AdminRouter"));
const BDRouter = lazy(() => import("./Routers/BDRouter"));

function App() {
  const { currentUser } = useSelector((state) => state.user);
  // const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  // const navigate = useNavigate();
  const isPublicRoute =
    location.pathname.startsWith("/public/") ||
    (location.hash && location.hash.startsWith("#/public/"));

  // useEffect(() => {
  //   if (currentUser?.role && location.pathname === "/") {
  //     if (currentUser.role === "Owner") {
  //       navigate("/admin/dashboard");
  //     } else if (currentUser.role === "BD") {
  //       navigate("/BD/dashboard");
  //     }
  //   }
  // }, [currentUser, location.pathname, navigate]);

  return (
    <>
      <GlobalStyle />

      {/* Global Theme Toggle — fixed top-right on every page */}
      <div
        style={{
          position: "fixed",
          top: "12px",
          right: "16px",
          zIndex: 99999,
        }}
      >
        <ThemeToggle />
      </div>

      <Wrapper>
        <Suspense
          fallback={
            <div className="loading-container">
              {/* <div className="spinner"></div> */ }
              <div className="spinner-wrapper">
                <div className="spinner-ring"></div>
                <PremiumLoader />
              </div>
            </div>
          }
        >
          {/* {currentUser &&
            location.pathname !== "/" &&
            location.pathname !== "/password-reset"} */}
          <Routes>
            <Route path="/public/r/:slug" element={ <PublicRequirementForm /> } />
            <Route path="/public/invoice/:token" element={ <PublicInvoice /> } />
            <Route path="/public/re_invoice/:token" element={ <PublicInvoice /> } />
            <Route path="/public/proposal/:token" element={ <PublicProposal /> } />

            {/* <Route
              path="/"
              element={currentUser ? <Navigate to="/dashboard" /> : <Login />}
            /> */}

            <Route
              path="/"
              element={
                !currentUser ? (
                  <Login />
                ) : isPublicRoute ? (
                  // public par ho toh kuch mat chhedo
                  <Navigate
                    to={ location.pathname + location.search + location.hash }
                    replace
                  />
                ) : currentUser.role === "Owner" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : currentUser.role === "BD" ? (
                  <Navigate to="/BD/dashboard" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* <Route
              path="/password-reset"
              element={
                currentUser ? <Navigate to="/dashboard" /> : <ForgotPassword />
              }
            /> */}

            <Route
              path="/register-admin"
              element={
                currentUser?.role === "Owner" ? (
                  <Navigate to="/admin/dashboard" />
                ) : currentUser?.role === "BD" ? (
                  <Navigate to="/BD/dashboard" />
                ) : (
                  <RegisterAdmin />
                )
              }
            />

            <Route
              path="/password-reset"
              element={
                currentUser?.role === "Owner" ? (
                  <Navigate to="/admin/dashboard" />
                ) : currentUser?.role === "BD" ? (
                  <Navigate to="/BD/dashboard" />
                ) : (
                  <ForgotPassword />
                )
              }
            />

            <Route
              path="/BD/*"
              element={
                currentUser?.role === "BD" ? (
                  <Suspense
                    fallback={
                      <div className="loading-container">
                        {/* <div className="spinner"></div> */ }
                        <div className="spinner-wrapper">
                          <div className="spinner-ring"></div>
                          <PremiumLoader />
                        </div>
                      </div>
                    }
                  >
                    <BDRouter />
                  </Suspense>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/admin/*"
              element={
                currentUser?.role === "Owner" ? (
                  <Suspense
                    fallback={
                      <div className="loading-container">
                        {/* <div className="spinner"></div> */ }
                        <div className="spinner-wrapper">
                          <div className="spinner-ring"></div>
                          <PremiumLoader />
                        </div>
                      </div>
                    }
                  >
                    <AdminRouter />
                  </Suspense>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </Suspense>
      </Wrapper>
    </>
  );
}

export default App;
const Wrapper = styled.div`
  .loading-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 9999;
  }

  /* .spinner {
    border: 6px solid #f3f3f3;
    border-top: 6px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  } */

  .spinner-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #e3f2fd, #fce4ec);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .spinner-ring {
    width: 150px;
    height: 150px;
    border: 8px solid transparent;
    border-top: 8px solid #dc620b;
    border-right: 8px solid #dc620b;
    border-radius: 50%;
    animation: spin 1.2s linear infinite;
    box-shadow: 0 0 8px rgba(238, 101, 3, 0.6);
    position: absolute;
  }

  .spinner-center {
    font-size: 20px;
    font-weight: bold;
    color: #dc620b;
    z-index: 1;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
`;

// useEffect(() => {
//   if (currentUser?.role && location.pathname === "/") {
//     setUserRole(currentUser.role);
//     if (location.pathname === "/") {
//       if (currentUser.role === "Owner") {
//         navigate("/admin/dashboard");
//       } else if (currentUser.role === "BD") {
//         navigate("/BD/dashboard");
//       }
//     }
//   }
// }, [currentUser, location.pathname, navigate]);
// console.log(userRole);

// <Route
//             path="/BD/dashboard"
//             element={
//               currentUser?.role === "BD" ? (
//                 <BusinessDeveloperDashboard />
//               ) : (
//                 <Navigate to="/" />
//               )
//             }
//           />

//           <Route
//             path="/admin/dashboard"
//             element={
//               currentUser?.role === "Owner" ? (
//                 <AdminDashboard />
//               ) : (
//                 <Navigate to="/" />
//               )
//             }
//           />
