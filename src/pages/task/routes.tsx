import { Route } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Tasks } from './Tasks';
import { CalendarPage } from './Calendar';

/**
 * 任务模块路由注册
 * 建议在 src/App.tsx 的主路由中引用
 */
export const TaskRoutes = (
    <>
        <Route path="task/dashboard" element={<Dashboard />} />
        <Route path="task/tasks" element={<Tasks />} />
        <Route path="task/calendar" element={<CalendarPage />} />
    </>
);
