import { useEffect, useContext, useMemo, Fragment, useState } from 'react';
import { IconButton, IContextualMenuProps, IIconProps, Stack, Text, Shimmer, ShimmerElementType } from '@fluentui/react';
import RestoplanProjectDetailPane from '../components/restoplanProjectDetailPane';
import { RestoplanProject } from '../models';
import * as projectActions from '../actions/projectActions';
import { RestoplanContext } from '../components/restoplanContext';
import { AppContext } from '../models/applicationState';
import { ProjectActions } from '../actions/projectActions';
import { stackItemPadding, stackPadding, titleStackStyles } from '../ux/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { bindActionCreators } from '../actions/actionCreators';
import WithApplicationInsights from '../components/telemetryWithAppInsights.tsx';

const HomePage = () => {
    const navigate = useNavigate();
    const appContext = useContext<AppContext>(RestoplanContext)
    const { projectId } = useParams();
    const actions = useMemo(() => ({
        projects: bindActionCreators(projectActions, appContext.dispatch) as unknown as ProjectActions,
    }), [appContext.dispatch]);

    const [isReady, setIsReady] = useState(false)

    // Select default project on initial load
    useEffect(() => {
        if (appContext.state.projects?.length && !projectId && !appContext.state.selectedProject) {
            const defaultProject = appContext.state.projects[0];
            navigate(`/projects/${defaultProject.id}`);
        }
    }, [appContext.state.projects, appContext.state.selectedProject, projectId, navigate])

    // React to selected project changes
    useEffect(() => {
        if (projectId && appContext.state.selectedProject?.id !== projectId) {
            actions.projects.load(projectId).then(() => setIsReady(true));
        } else if (appContext.state.selectedProject) {
            setIsReady(true);
        }
    }, [actions.projects, appContext.state.selectedProject, projectId])

    const onProjectEdited = async (project: RestoplanProject) => {
        await actions.projects.save(project);
    }

    const deleteProject = () => {
        if (appContext.state.selectedProject?.id) {
            actions.projects.remove(appContext.state.selectedProject.id);
            navigate('/projects');
        }
    }

    const iconProps: IIconProps = {
        iconName: 'More',
        styles: {
            root: {
                fontSize: 14
            }
        }
    }

    const menuProps: IContextualMenuProps = {
        items: [
            {
                key: 'delete',
                text: 'Delete Project',
                iconProps: { iconName: 'Delete' },
                onClick: () => { deleteProject() }
            }
        ]
    }

    return (
        <Stack>
            <Stack.Item>
                <Stack horizontal styles={titleStackStyles} tokens={stackPadding}>
                    <Stack.Item grow={1}>
                        <Shimmer width={300}
                            isDataLoaded={!!appContext.state.selectedProject}
                            shimmerElements={
                                [
                                    { type: ShimmerElementType.line, height: 20 }
                                ]
                            } >
                            <Fragment>
                                <Text block variant="xLarge">{appContext.state.selectedProject?.name}</Text>
                                <Text variant="small">{appContext.state.selectedProject?.description}</Text>
                            </Fragment>
                        </Shimmer>
                    </Stack.Item>
                    <Stack.Item>
                        <IconButton
                            disabled={!isReady}
                            menuProps={menuProps}
                            iconProps={iconProps}
                            styles={{ root: { fontSize: 16 } }}
                            title="Project Actions"
                            ariaLabel="Project Actions" />
                    </Stack.Item>
                </Stack>
            </Stack.Item>
            <Stack.Item tokens={stackItemPadding}>
                <RestoplanProjectDetailPane
                    project={appContext.state.selectedProject}
                    onEdit={onProjectEdited}
                    onCancel={() => {}} />
            </Stack.Item>
        </Stack >
    );
};

const HomePageWithTelemetry = WithApplicationInsights(HomePage, 'HomePage');

export default HomePageWithTelemetry;
