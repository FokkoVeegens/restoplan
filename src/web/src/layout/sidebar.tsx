import { FC, ReactElement } from 'react';
import RestoplanProjectMenu from '../components/restoplanProjectMenu';
import { RestoplanProject } from '../models/restoplanProject';

interface SidebarProps {
    selectedProject?: RestoplanProject
    projects?: RestoplanProject[];
    onProjectCreate: (project: RestoplanProject) => void
}

const Sidebar: FC<SidebarProps> = (props: SidebarProps): ReactElement => {
    return (
        <div>
            <RestoplanProjectMenu
                selectedProject={props.selectedProject}
                projects={props.projects}
                onCreate={props.onProjectCreate} />
        </div>
    );
};

export default Sidebar;