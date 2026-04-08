import { IIconProps, INavLink, INavLinkGroup, Nav, Stack, TextField } from '@fluentui/react';
import { FC, ReactElement, useState, FormEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import { RestoplanProject } from '../models/restoplanProject';
import { stackItemPadding } from '../ux/styles';

interface RestoplanProjectMenuProps {
    selectedProject?: RestoplanProject
    projects?: RestoplanProject[]
    onCreate: (project: RestoplanProject) => void
}

const iconProps: IIconProps = {
    iconName: 'Car'
}

const RestoplanProjectMenu: FC<RestoplanProjectMenuProps> = (props: RestoplanProjectMenuProps): ReactElement => {
    const navigate = useNavigate();
    const [newProjectName, setNewProjectName] = useState('');

    const onNavLinkClick = (evt?: MouseEvent<HTMLElement>, item?: INavLink) => {
        evt?.preventDefault();

        if (!item) {
            return;
        }

        navigate(`/projects/${item.key}`);
    }

    const createNavGroups = (projects: RestoplanProject[]): INavLinkGroup[] => {
        const links = projects.map(project => ({
            key: project.id,
            name: project.name,
            url: `/projects/${project.id}`,
            links: [],
            isExpanded: props.selectedProject ? project.id === props.selectedProject.id : false
        }));

        return [{
            links: links
        }]
    }

    const onNewProjectNameChange = (_evt: FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
        setNewProjectName(value || '');
    }

    const onFormSubmit = async (evt: FormEvent<HTMLFormElement>) => {
        evt.preventDefault();

        if (newProjectName) {
            props.onCreate({ name: newProjectName });
            setNewProjectName('');
        }
    }

    return (
        <Stack>
            <Stack.Item>
                <Nav
                    selectedKey={props.selectedProject?.id}
                    onLinkClick={onNavLinkClick}
                    groups={createNavGroups(props.projects || [])} />
            </Stack.Item>
            <Stack.Item tokens={stackItemPadding}>
                <form onSubmit={onFormSubmit}>
                    <TextField
                        borderless
                        iconProps={iconProps}
                        value={newProjectName}
                        placeholder="New Project"
                        onChange={onNewProjectNameChange} />
                </form>
            </Stack.Item>
        </Stack>
    );
};

export default RestoplanProjectMenu;
