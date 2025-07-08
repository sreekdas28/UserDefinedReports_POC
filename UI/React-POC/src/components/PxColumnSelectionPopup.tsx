import React, { useEffect, useState } from 'react';
import PxPopup from './PxPopup';
import { GridColumnState } from '@progress/kendo-react-grid';
import { IGridColumn } from '@/shared/interfaces/datagrid.interface';
import { Checkbox } from '@progress/kendo-react-inputs';
import { Tooltip } from '@progress/kendo-react-tooltip';

type ExtendedGridColumnState = GridColumnState & {
  locked?: boolean;
  columnHidden?: boolean;
  mandatoryColumn?: boolean;
};

interface IColumnSelectionPopupProps {
  show: boolean;
  anchor: HTMLElement | null;
  columnsState: ExtendedGridColumnState[];
  columns: IGridColumn[];
  setColumns: (columns: IGridColumn[]) => void;
  setColumnsState: (columnsState: ExtendedGridColumnState[]) => void;
  onClose: () => void;
}

const PxColumnSelectionPopup: React.FC<IColumnSelectionPopupProps> = ({
  show,
  anchor,
  columnsState,
  columns,
  setColumns,
  setColumnsState,
  onClose,
}) => {
  const [allSelected, setAllSelected] = useState(true);

  useEffect(() => {
    const visibleCount = columns.filter(col => !col.mandatoryColumn && !col.columnHidden).length;
    const totalSelectable = columns.filter(col => !col.mandatoryColumn).length;
    setAllSelected(visibleCount === totalSelectable);
  }, [columns]);

  const handleToggleAll = () => {
    const shouldHide = allSelected;

    const updated = columns.map(col =>
      !col.mandatoryColumn ? { ...col, columnHidden: shouldHide } : {...col},
    );

    setColumns?.(updated);
    setColumnsState(
      updated.map((col, index) => ({
        ...col,
        id: col.id ? String(col.id) : `column-${index}`,
      })),
    );
  };

  if (!show || !anchor) return null;

  // Sort columnsState: selected columns first, then alphabetically by title
  const sortedColumnsState = [...columnsState].sort((a, b) => {
    const aSelected = !a.columnHidden;
    const bSelected = !b.columnHidden;

    if (aSelected !== bSelected) {
      return aSelected ? -1 : 1;
    }

    return (a.title ?? '').localeCompare(b.title ?? '');
  });

  return (
    <PxPopup show={true} anchor={anchor}  onClose={onClose} popupClassName='column-selection-popup'>
      <div className='column-selection-popup-head'>
        <h5 className='ui-sm-medium'>Select Columns</h5>
      </div>

      <div className='column-selection-popup-content'>
        <div className='column-selection-list'>
          <div className='column-selection-list-item'>
            <Tooltip position='bottom' anchorElement='target'>
              <div className='app-c-error-info' title={allSelected ? 'Unselect All' : 'Select All'}>
                <Checkbox
                  checked={allSelected}
                  label={allSelected ? 'Unselect All' : 'Select All'}
                  onChange={handleToggleAll}
                />
              </div>
            </Tooltip>
          </div>
          {sortedColumnsState.map(column => {
            if (column.mandatoryColumn) return null;
            

            const checkedCount = columns.filter(
              col => !col.mandatoryColumn && !col.columnHidden,
            ).length;

            const isDisabled = checkedCount === 1 && !column.columnHidden;

            return (
              <div
                key={column.field}
                className={`column-selection-list-item ${!column.columnHidden ? 'selected' : ''}`}
              >
                <Checkbox
                  checked={!column.columnHidden}
                  disabled={isDisabled || column.disabled}
                  label={column.headerText || column.field}
                  onChange={() => {
                    const updated = columns.map(col =>
                      col.field === column.field
                        ? { ...col, columnHidden: !col.columnHidden, hidden: !col.columnHidden}
                        : col,
                    );

                    const updatedState = columnsState.map(col =>
                      col.field === column.field
                        ? { ...col, columnHidden: !col.columnHidden, hidden: !col.columnHidden}
                        : col,
                    );

                    

                    setColumns?.(updated);
                    setColumnsState(
                      updatedState.map((col, index) => ({
                        ...col,
                        id: col.id ? String(col.id) : `column-${index}`,
                      })),
                    );
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </PxPopup>
  );
};

export default React.memo(PxColumnSelectionPopup);

 