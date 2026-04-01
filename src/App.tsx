import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/common/AuthGuard';
import { RoomListPage } from './pages/RoomListPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { RoomPage } from './pages/RoomPage';

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/rooms"
            element={
              <AuthGuard>
                <RoomListPage />
              </AuthGuard>
            }
          />
          <Route
            path="/rooms/new"
            element={
              <AuthGuard>
                <CreateRoomPage />
              </AuthGuard>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <AuthGuard>
                <RoomPage />
              </AuthGuard>
            }
          />
          <Route path="*" element={<Navigate to="/rooms" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
