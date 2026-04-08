import { FC, ReactElement, useContext, useEffect, useMemo } from 'react';
import Header from './header';
import Sidebar from './sidebar';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from '../pages/homePage';
import { Stack } from '@fluentui/react';
import { AppContext } from '../models/applicationState';
import { RestoplanContext } from '../components/restoplanContext';
import * as projectActions from '../actions/projectActions';
import { ProjectActions } from '../actions/projectActions';
import { RestoplanProject } from '../models';
import { headerStackStyles, mainStackStyles, rootStackStyles, sidebarStackStyles } from '../ux/styles';
import { bindActionCreators } from '../actions/actionCreators';

const Layout: FC = (): ReactElement => {
    const navigate = useNavigate();
    const appContext = useContext<AppContext>(RestoplanContext)
    const actions = useMemo(() => ({
        projects: bindActionCreators(projectActions, appContext.dispatch) as unknown as ProjectActions,
    }), [appContext.dispatch]);

    // Load initial projects
    useEffect(() => {
        if (!appContext.state.projects) {
            actions.projects.list();
        }
    }, [actions.projects, appContext.state.projects]);

    const onProjectCreated = async (project: RestoplanProject) => {
        const newProject = await actions.projects.save(project);
        navigate(`/projects/${newProject.id}`);
    }

    return (
        <Stack styles={rootStackStyles}>
            <Stack.Item styles={headerStackStyles}>
                <Header></Header>
            </Stack.Item>
            <Stack horizontal grow={1}>
                <Stack.Item styles={sidebarStackStyles}>
                    <Sidebar
                        selectedProject={appContext.state.selectedProject}
                        projects={appContext.state.projects}
                        onProjectCreate={onProjectCreated} />
                </Stack.Item>
                <Stack.Item grow={1} styles={mainStackStyles}>
                    <Routes>
                        <Route path="/projects/:projectId" element={<HomePage />} />
                        <Route path="/projects" element={<HomePage />} />
                        <Route path="/" element={<HomePage />} />
                    </Routes>
                </Stack.Item>
            </Stack>
        </Stack>
    );
}

export default Layout;
