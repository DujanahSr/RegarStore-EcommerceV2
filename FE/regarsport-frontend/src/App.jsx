import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ScreenLoader } from "./components/common/UiStates";
import About from "./pages/customer/About";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Products = lazy(() => import("./pages/admin/Products"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Users = lazy(() => import("./pages/admin/Users"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));
const Home = lazy(() => import("./pages/customer/Home"));
const ProductDetail = lazy(() => import("./pages/customer/ProductDetail"));
const Cart = lazy(() => import("./pages/customer/Cart"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const Favorites = lazy(() => import("./pages/customer/Favorites"));
const MyOrders = lazy(() => import("./pages/customer/MyOrders"));
const OrderDetail = lazy(() => import("./pages/customer/OrderDetail"));
const Landing = lazy(() => import("./pages/customer/Landing"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const WarehouseDashboard = lazy(() => import("./pages/admin/WarehouseDashboard"));
const Vouchers = lazy(() => import("./pages/admin/Vouchers"));
const WarrantyClaims = lazy(() => import("./pages/admin/WarrantyClaims"));
const AdminLayouts = lazy(() => import("./layouts/AdminLayouts"));
const CustomerLayouts = lazy(() => import("./layouts/CustomerLayouts"));


export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#111827",
            color: "#fff",
          },
        }}
      />
      <ConfirmProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Suspense fallback={<ScreenLoader />}>
              <Routes>

                {/* Public Landing Page */}
                <Route
                  path="/"
                  element={<Landing />}
                />

                {/* Auth */}
                <Route
                  path="/login"
                  element={<Login />}
                />

                <Route
                  path="/register"
                  element={<Register />}
                />

                <Route
                  path="/forgot-password"
                  element={<ForgotPassword />}
                />

                <Route
                  path="/verify-email"
                  element={<VerifyEmail />}
                />

                {/* CUSTOMER SHOP & BROWSING (PUBLIC ACCESS) */}
                <Route
                  path="/dashboard"
                  element={<CustomerLayouts />}
                >
                  <Route
                    index
                    element={<Home />}
                  />

                  <Route
                    path="product/:id"
                    element={<ProductDetail />}
                  />

                  <Route path="about" element={<About />} />

                  <Route
                    path="cart"
                    element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="favorites"
                    element={
                      <ProtectedRoute>
                        <Favorites />
                      </ProtectedRoute>
                    }
                  />

                  {/* PROTECTED CUSTOMER ACTIONS */}
                  <Route
                    path="checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="my-orders"
                    element={
                      <ProtectedRoute>
                        <MyOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* ADMIN & LOGISTICS */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "logistics"]}>
                      <AdminLayouts />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="categories"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Categories />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="products"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Products />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="warehouse"
                    element={<WarehouseDashboard />}
                  />

                  <Route
                    path="inventory"
                    element={<Inventory />}
                  />

                  <Route
                    path="orders"
                    element={<Orders />}
                  />

                  <Route
                    path="warranty-claims"
                    element={<WarrantyClaims />}
                  />

                  <Route
                    path="vouchers"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Vouchers />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reviews"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Reviews />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="profile"
                    element={<Profile />}
                  />
                </Route>

              </Routes>
            </Suspense>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      </ConfirmProvider>
    </BrowserRouter>
  );
}