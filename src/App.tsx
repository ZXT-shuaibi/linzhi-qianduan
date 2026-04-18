import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import AuthPage from "./pages/AuthPage";
import CreatePage from "./pages/CreatePage";
import DiscoverPage from "./pages/DiscoverPage";
import MarketPage from "./pages/MarketPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/discover"
        element={
          <AppShell
            title="邻里知光"
            subtitle="把原型里的温度感和社区感先落成一版可继续接接口的前端。"
          >
            <DiscoverPage />
          </AppShell>
        }
      />
      <Route
        path="/market"
        element={
          <AppShell
            title="社区集市"
            subtitle="先用本地数据跑通领券、下单、成交感知，接口入口统一放到 TODO 服务。"
          >
            <MarketPage />
          </AppShell>
        }
      />
      <Route
        path="/create"
        element={
          <AppShell
            title="发布广场"
            subtitle="保留原型中的主题、上传和文本创作氛围，后面只需要把发布接口替换掉。"
          >
            <CreatePage />
          </AppShell>
        }
      />
      <Route
        path="/profile"
        element={
          <AppShell
            title="我的邻里名片"
            subtitle="个人资料、动态、收藏和关注都先完成交互闭环，后面再接真实数据。"
          >
            <ProfilePage />
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default App;
