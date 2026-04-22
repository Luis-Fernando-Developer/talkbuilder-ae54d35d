
import './App.css'

import { Routes, Route } from "react-router-dom";

// importa suas páginas

import BotPage from "./pages/workspace/bot/[id]/page";
import FolderPage from "./pages/workspace/folder/[id]/page";
import ConfigPage from "./pages/workspace/configs/page";
import PerfilPage from "./pages/workspace/perfil/page";

// layout
import Layout from "./components/layout";
import WorkspaceMain from './components/Main';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<WorkspaceMain />} />

        <Route path="/workspace/bot/:id" element={<BotPage />} />

        <Route path="/workspace/folder/:id" element={<FolderPage />} />

        <Route path="/workspace/configs" element={<ConfigPage />} />

        <Route path="/workspace/perfil" element={<PerfilPage />} />
      </Routes>
    </Layout>
  );
}

export default App;