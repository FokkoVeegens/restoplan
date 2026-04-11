import { Text, Stack, TextField, PrimaryButton, DefaultButton, FontIcon } from '@fluentui/react';
import { useEffect, useState, FC, ReactElement, MouseEvent } from 'react';
import { RestoplanProject } from '../models';
import { stackGaps, stackItemMargin, stackItemPadding } from '../ux/styles';

interface RestoplanProjectDetailPaneProps {
    project?: RestoplanProject;
    onEdit: (project: RestoplanProject) => void
    onCancel: () => void
}

export const RestoplanProjectDetailPane: FC<RestoplanProjectDetailPaneProps> = (props: RestoplanProjectDetailPaneProps): ReactElement => {
    const [name, setName] = useState(props.project?.name || '');
    const [description, setDescription] = useState(props.project?.description);
    const [brand, setBrand] = useState(props.project?.brand);
    const [type, setType] = useState(props.project?.type);

    useEffect(() => {
        setName(props.project?.name || '');
        setDescription(props.project?.description);
        setBrand(props.project?.brand);
        setType(props.project?.type);
    }, [props.project]);

    const saveProject = (evt: MouseEvent<HTMLButtonElement>) => {
        evt.preventDefault();

        if (!props.project?.id) {
            return;
        }

        props.onEdit({
            id: props.project.id,
            name,
            description,
            brand,
            type,
        });
    };

    return (
        <Stack>
            {props.project
                ? (
                    <Stack.Item tokens={stackItemMargin}>
                        <TextField label="Name" placeholder="Project name" required value={name} onChange={(_e, value) => setName(value || '')} />
                        <TextField label="Description" placeholder="Project description" multiline value={description || ''} onChange={(_e, value) => setDescription(value)} />
                        <TextField label="Brand" placeholder="e.g. Ford, Chevrolet" value={brand || ''} onChange={(_e, value) => setBrand(value)} />
                        <TextField label="Type / Model" placeholder="e.g. Mustang, Corvette" value={type || ''} onChange={(_e, value) => setType(value)} />
                        <Stack tokens={stackGaps} horizontal styles={{ root: { marginTop: 16 } }}>
                            <PrimaryButton text="Save" onClick={saveProject} />
                            <DefaultButton text="Cancel" onClick={props.onCancel} />
                        </Stack>
                    </Stack.Item>
                )
                : (
                    <Stack.Item tokens={stackItemPadding} style={{ textAlign: "center" }} align="center">
                        <FontIcon iconName="Car" style={{ fontSize: 24, padding: 20 }} />
                        <Text block>Select a project to view details</Text>
                    </Stack.Item>
                )
            }
        </Stack>
    );
}

export default RestoplanProjectDetailPane;
