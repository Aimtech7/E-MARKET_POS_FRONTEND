import React, { FC } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Guard from "./Guards/Guard";
import PosPage from "./Pages/PosPage";
import ProductPage from "./Pages/ProductPage";
import CategoryPage from "./Pages/CategoryPage";
import UnitOfMeasurePage from "./Pages/UnitOfMeasurePage";
import SupplierPage from "./Pages/SupplierPage";
import PurchaseOrderPage from "./Pages/PurchaseOrderPage";
import AuditLogsPage from "./Pages/AuditLogsPage";
import AuthenticationGuard from "./Guards/AuthenticationGuard";
import AdminGuard from "./Guards/AdminGuard";
import AuthenticationPage from "./Pages/AuthenticationPage";
import Layout from "./Layout";
import Dashboard from "./Pages/Dashboard";
import Logout from "./Pages/Logout";
import SalesPage from "./Pages/SalesPage";
import InventoryPage from "./Pages/InventoryPage";
import ReceiptPage from "./Pages/ReceiptPage";
import ReportsPage from "./Pages/ReportsPage";
import SettingsPage from "./Pages/SettingsPage";
import BackupPage from "./Pages/BackupPage";
import ClosurePage from "./Pages/ClosurePage";
import UserManagementPage from "./Pages/UserManagementPage";

const Router: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          index
          element={
            <Guard>
              <Layout>
                <PosPage />
              </Layout>
            </Guard>
          }
        ></Route>
        <Route
          path="/product"
          element={
            <AdminGuard>
              <Layout>
                <ProductPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/category"
          element={
            <AdminGuard>
              <Layout>
                <CategoryPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/unit-measure"
          element={
            <AdminGuard>
              <Layout>
                <UnitOfMeasurePage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/suppliers"
          element={
            <AdminGuard>
              <Layout>
                <SupplierPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/purchase-orders"
          element={
            <AdminGuard>
              <Layout>
                <PurchaseOrderPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/audit"
          element={
            <AdminGuard>
              <Layout>
                <AuditLogsPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>

        <Route
          path="/auth"
          element={
            <AuthenticationGuard>
              <Layout>
                <AuthenticationPage />
              </Layout>
            </AuthenticationGuard>
          }
        ></Route>
        <Route
          path="/dashboard"
          element={
            <AdminGuard>
              <Layout>
                <Dashboard />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/sales-history"
          element={
            <Guard>
              <Layout>
                <SalesPage />
              </Layout>
            </Guard>
          }
        ></Route>
        <Route
          path="/receipts"
          element={
            <Guard>
              <Layout>
                <ReceiptPage />
              </Layout>
            </Guard>
          }
        ></Route>
        <Route
          path="/reports"
          element={
            <AdminGuard>
              <Layout>
                <ReportsPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/settings"
          element={
            <AdminGuard>
              <Layout>
                <SettingsPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/inventory"
          element={
            <Guard>
              <Layout>
                <InventoryPage />
              </Layout>
            </Guard>
          }
        ></Route>
        <Route
          path="/logout"
          element={
            <Guard>
              <Layout>
                <Logout />
              </Layout>
            </Guard>
          }
        ></Route>
        <Route
          path="/closures"
          element={
            <Guard>
              <Layout>
                <ClosurePage />
              </Layout>
            </Guard>
          }
        ></Route>
        <Route
          path="/backups"
          element={
            <AdminGuard>
              <Layout>
                <BackupPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
        <Route
          path="/management/users"
          element={
            <AdminGuard>
              <Layout>
                <UserManagementPage />
              </Layout>
            </AdminGuard>
          }
        ></Route>
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
