import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import Login from "../pages/Login/Login";
import Inicio from "../pages/Inicio/Inicio";
import Produtos from "../pages/Produtos/Produtos";
import GruposMateriaPrima from "../pages/GruposMateriaPrima/GruposMateriaPrima";
import Maquinas from "../pages/Maquinas/Maquinas";
import Embalagens from "../pages/Embalagens/Embalagens";
import Pessoas from "../pages/Pessoas/Pessoas";
import Receitas from "../pages/Receitas/Receitas";
import FichaTecnica from "../pages/FichaTecnica/FichaTecnica";
import Configuracoes from "../pages/Configuracoes/Configuracoes";
import Empresas from "../pages/Empresas/Empresas";
import Usuarios from "../pages/Usuarios/Usuarios";
import Cadastro from "../pages/Cadastro/Cadastro";

import ImportacaoProdutos from "../components/ImportacaoProdutos/ImportacaoProdutos";

import AppLayout from "../layout/AppLayout";

import { authService } from "../services/authService";

function RotaProtegida({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!authService.estaLogado()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={
            authService.estaLogado() ? (
              <Navigate
                to="/inicio"
                replace
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          element={
            <RotaProtegida>
              <AppLayout />
            </RotaProtegida>
          }
        >
          <Route
            path="/inicio"
            element={<Inicio />}
          />

          <Route
            path="/produtos"
            element={<Produtos />}
          />

          <Route
            path="/grupos-materia-prima"
            element={
              <GruposMateriaPrima />
            }
          />

          <Route
            path="/maquinas"
            element={<Maquinas />}
          />

          <Route
            path="/embalagens"
            element={<Embalagens />}
          />

          <Route
            path="/pessoas"
            element={<Pessoas />}
          />

          <Route
            path="/receitas"
            element={<Receitas />}
          />

          <Route
            path="/ficha-tecnica"
            element={<FichaTecnica />}
          />

          <Route
            path="/configuracoes"
            element={<Configuracoes />}
          />

          <Route
            path="/empresas"
            element={<Empresas />}
          />

          <Route
            path="/usuarios"
            element={<Usuarios />}
          />

          <Route
            path="/importacao"
            element={
              <ImportacaoProdutos />
            }
          />

          <Route
            path="/cadastro"
            element={<Cadastro />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}