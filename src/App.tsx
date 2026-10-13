import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import IdnClub from './pages/IdnClub';
import IdnAcademy from './pages/IdnAcademy';
import Recognition from './pages/Recognition';
import EmployeeJourney from './pages/EmployeeJourney';
import DepartmentAnalytics from './pages/DepartmentAnalytics';
import DeptReportPage from './pages/DeptReportPage';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Overview /></Layout>} />
          <Route path="/idn-club" element={<Layout><IdnClub /></Layout>} />
          <Route path="/idn-academy" element={<Layout><IdnAcademy /></Layout>} />
          <Route path="/recognition" element={<Layout><Recognition /></Layout>} />
          <Route path="/employee-journey" element={<Layout><EmployeeJourney /></Layout>} />
          <Route path="/department-analytics" element={<Layout><DepartmentAnalytics /></Layout>} />
          <Route path="/report" element={<DeptReportPage />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;