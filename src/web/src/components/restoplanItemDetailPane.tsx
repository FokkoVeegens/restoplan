import { Text, DatePicker, Stack, TextField, PrimaryButton, DefaultButton, Dropdown, IDropdownOption, FontIcon } from '@fluentui/react';
import { useEffect, useState, FC, ReactElement, MouseEvent, FormEvent } from 'react';
import { RestoplanItem, RestoplanItemState } from '../models';
import { stackGaps, stackItemMargin, stackItemPadding, titleStackStyles } from '../ux/styles';

interface RestoplanItemDetailPaneProps {
    item?: RestoplanItem;
    onEdit: (item: RestoplanItem) => void
    onCancel: () => void
}

export const RestoplanItemDetailPane: FC<RestoplanItemDetailPaneProps> = (props: RestoplanItemDetailPaneProps): ReactElement => {
    const [name, setName] = useState(props.item?.name || '');
    const [description, setDescription] = useState(props.item?.description);
    const [dueDate, setDueDate] = useState(props.item?.dueDate);
    const [startDate, setStartDate] = useState(props.item?.startDate);
    const [state, setState] = useState(props.item?.state || RestoplanItemState.Todo);

    useEffect(() => {
        setName(props.item?.name || '');
        setDescription(props.item?.description);
        setDueDate(props.item?.dueDate ? new Date(props.item?.dueDate) : undefined);
        setStartDate(props.item?.startDate ? new Date(props.item?.startDate) : undefined);
        setState(props.item?.state || RestoplanItemState.Todo);
    }, [props.item]);

    const saveRestoplanItem = (evt: MouseEvent<HTMLButtonElement>) => {
        evt.preventDefault();

        if (!props.item?.id) {
            return;
        }

        const RestoplanItem: RestoplanItem = {
            id: props.item.id,
            listId: props.item.listId,
            name: name,
            description: description,
            dueDate: dueDate,
            startDate: startDate,
            state: state,
        };

        props.onEdit(RestoplanItem);
    };

    const cancelEdit = () => {
        props.onCancel();
    }

    const onStateChange = (_evt: FormEvent<HTMLDivElement>, value?: IDropdownOption) => {
        if (value) {
            setState(value.key as RestoplanItemState);
        }
    }

    const onDueDateChange = (date: Date | null | undefined) => {
        setDueDate(date || undefined);
    }

    const onStartDateChange = (date: Date | null | undefined) => {
        setStartDate(date || undefined);
    }

    const restoplanStateOptions: IDropdownOption[] = [
        { key: RestoplanItemState.Todo, text: 'To Do' },
        { key: RestoplanItemState.InProgress, text: 'In Progress' },
        { key: RestoplanItemState.Done, text: 'Done' },
    ];

    return (
        <Stack>
            {props.item &&
                <>
                    <Stack.Item styles={titleStackStyles} tokens={stackItemPadding}>
                        <Text block variant="xLarge">{name}</Text>
                        <Text variant="small">{description}</Text>
                    </Stack.Item>
                    <Stack.Item tokens={stackItemMargin}>
                        <TextField label="Name" placeholder="Item name" required value={name} onChange={(_e, value) => setName(value || '')} />
                        <TextField label="Description" placeholder="Item description" multiline size={20} value={description || ''} onChange={(_e, value) => setDescription(value)} />
                        <Dropdown label="State" options={restoplanStateOptions} required selectedKey={state} onChange={onStateChange} />
                        <DatePicker label="Start Date" placeholder="Start date" value={startDate} onSelectDate={onStartDateChange} />
                        <DatePicker label="Due Date" placeholder="Due date" value={dueDate} onSelectDate={onDueDateChange} />
                    </Stack.Item>
                    <Stack.Item tokens={stackItemMargin}>
                        <Stack horizontal tokens={stackGaps}>
                            <PrimaryButton text="Save" onClick={saveRestoplanItem} />
                            <DefaultButton text="Cancel" onClick={cancelEdit} />
                        </Stack>
                    </Stack.Item>
                </>
            }
            {!props.item &&
                <Stack.Item tokens={stackItemPadding} style={{ textAlign: "center" }} align="center">
                    <FontIcon iconName="WorkItem" style={{ fontSize: 24, padding: 20 }} />
                    <Text block>Select an item to edit</Text>
                </Stack.Item>}
        </Stack >
    );
}

export default RestoplanItemDetailPane;