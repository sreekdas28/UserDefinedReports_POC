import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, ButtonHandle } from '@progress/kendo-react-buttons';
import { Grid, GridColumn as Column, GridToolbar, GridSearchBox, GridColumnResizeEvent, operators, GridCellProps } from '@progress/kendo-react-grid';
import { BudgetCell, ColumnMenu, PersonCell, ProgressCell, RatingCell, CountryCell } from '../components/CustomCell';

import { process, State, filterBy, CompositeFilterDescriptor, groupBy, GroupResult } from '@progress/kendo-data-query';
import { GridLayout, GridLayoutItem } from '@progress/kendo-react-layout';
import {
  Filter,
  Operators,
  TextFilter,
  NumericFilter,
  DateFilter,
  BooleanFilter,
  FilterChangeEvent,
  setGroupIds
} from '@progress/kendo-react-data-tools';
import { Window } from '@progress/kendo-react-dialogs';
import { APIService } from '../services/APIService';
import { employees } from '../data/employee';
import { vendors } from '../data/vendor';
import StimViewerWrapper from '../components/StimViewerWrapper';
import PxColumnSelectionPopup from '../components/PxColumnSelectionPopup';
import { IExtendedGridColumnState } from '../shared/interfaces/datagrid.interface';
import { createPortal } from 'react-dom';
import { Switch } from '@progress/kendo-react-inputs';
import dayjs from 'dayjs';
import FullScreenLoader from '../components/FullScreenLoader';
import { camelToPascal, reverseKeyMap } from '../utils/helper';
import { eyeIcon as PreviewIcon, filterIcon, listUnorderedSquareIcon } from '@progress/kendo-svg-icons';
const DATA_ITEM_KEY = 'id';
type Column = Record<string, unknown>;



type CombinedState = State & {
  columns?: Record<string, unknown>[];
  sort: Record<string, unknown>[];
  total?: string | number,
};

interface CustomGridColumn {
  field?: string;
  title?: string;
  width?: number | string;
  id?: string; // Kendo often adds an 'id' for internal tracking, especially with nested columns
  columnMenu?: any;
  cells?: { data: React.ComponentType<any> };
  filterable?: boolean;
  groupable?: boolean;
  columnType?: string;
  columns?: CustomGridColumn[]; // For nested columns
  [key: string]: any; // Allow other properties
}

const OrderedDateCell = (props: GridCellProps) => {
  const value = props.dataItem[props.field || ''];
  const formattedDate = value ? dayjs(value).format('DD/MM/YYYY') : '';
  return <td>{formattedDate}</td>;
};

const columnTitleMap: Record<string, string> = {
  orderNumber: 'Order Number',
  itemCode: 'Item Code',
  itemDescription: 'Item Description',
  quantity: 'Quantity',
  unitPrice: 'Unit Price',
  vendorName: 'Vendor Name',
  vendorCode: 'Vendor Code',
  vendorContact: 'Vendor Contact',
  orderStatus: 'Order Status',
  orderedDate: 'Ordered Date',
  lineAmt: 'Line Amount'
};


// Reverse the map: label -> field
const titleToFieldMap = Object.entries(columnTitleMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

// Recursive function to replace field labels with field names
function replaceFieldLabels(filter: any): any {
  if (filter.filters) {
    return {
      ...filter,
      filters: filter.filters.map(replaceFieldLabels),
    };
  }

  return {
    ...filter,
    field: titleToFieldMap[filter.field] || filter.field,
  };
}

const defaultColumns = [
  { field: columnTitleMap['orderNumber'], title: 'Order Number', headerText: 'Order Number', ColumnMenu: ColumnMenu, width: 200 },
  { field: columnTitleMap['itemCode'], title: 'Item Code', headerText: 'Item Code', ColumnMenu: ColumnMenu, width: 220 },
  { field: columnTitleMap['itemDescription'], title: 'Item Description', headerText: 'Item Description', ColumnMenu: ColumnMenu, width: 270 },
  { field: columnTitleMap['quantity'], title: 'Quantity', headerText: 'Quantity', ColumnMenu: ColumnMenu, width: 250, className: 'k-numeric-field', headerClassName: 'k-numeric-field' },
  { field: columnTitleMap['unitPrice'], title: 'Unit Price', headerText: 'Unit Price', ColumnMenu: ColumnMenu, width: 150, className: 'k-numeric-field', headerClassName: 'k-numeric-field' },
  { field: columnTitleMap['vendorName'], title: 'Vendor Name', headerText: 'Vendor Name', ColumnMenu: ColumnMenu, width: 230 },
  { field: columnTitleMap['vendorCode'], title: 'Vendor Code', headerText: 'Vendor Code', ColumnMenu: ColumnMenu, width: 230 },
  { field: columnTitleMap['vendorContact'], title: 'Vendor Contact', headerText: 'Vendor Contact', ColumnMenu: ColumnMenu, width: 230 },
  { field: columnTitleMap['orderStatus'], title: 'Order Status', headerText: 'Order Status', ColumnMenu: ColumnMenu, width: 150 },
  { field: columnTitleMap['orderedDate'], title: 'Ordered Date', headerText: 'Ordered Date', ColumnMenu: ColumnMenu, width: 150, cell: OrderedDateCell },
  { field: columnTitleMap['lineAmt'], title: 'Line Amount', headerText: 'Line Amount', ColumnMenu: ColumnMenu, width: 150, className: 'k-numeric-field', headerClassName: 'k-numeric-field' }
]

const Employees = () => {
  let _pdfExport: any;
  let _export: any;

  const exportExcel = () => {
    _export.save();
  };

  const exportPDF = () => {
    _pdfExport.save();
  };


  const [showPopup, setShowPopup] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);

  const [loading, setLoading] = useState(false)


  const [columns, setColumns] = useState(defaultColumns);

  const [columnsState, setColumnsState] = useState<IExtendedGridColumnState[]>(
    columns.map((col, index) => ({
      ...col,
      id: col.id ? String(col.id) : `column-${index}`,
      orderIndex: index,
      children: undefined,
      locked: col.locked ?? false,
      editable: col.editable ?? false,
      editor: col.editor ?? 'text',
    })),
  );

  const [gridDataState, setGridDataState] = useState<CombinedState>({
    sort: [],
    group: [],
    skip: 0,
    take: 10,


  });

  const [vendorData, setVendorData] = useState([])

  const processWithGroups = (data = [], dataState: State) => {
    let newData = [];
    if (dataState.group?.length) {

      // if(typeof aggregates !== undefined){
      //   dataState.group.forEach((group) => (group.aggregates = aggregates));
      // }
      const tempData = process(data, dataState)
      newData = tempData[0]?.items;
      //  newData = groupBy(data as GroupResult[], group);

      //  debugger 

      setGroupIds({ data: data, group: dataState.group });

    } else {
      const tempData = process(data, dataState);
      newData = tempData as unknown as Array<any>
    }





    return newData;
  };





  /**
   * @description Call API to get Data 
   */
  const getTableData = async () => {

    try {

      let updatedGridState = {};
      if (gridDataState?.group) {
        const modifiedGroups = [...gridDataState.group || []].map((item) => {
          return {
            ...item,
            field: camelToPascal(reverseKeyMap(columnTitleMap)[item.field])
          }
        });
        updatedGridState = {
          ...gridDataState,
          group: modifiedGroups
        }
      }

      if (gridDataState?.filter) {
        const modifiedFilters = replaceFieldLabels(gridDataState.filter);
        updatedGridState = {
          ...updatedGridState,
          filter: modifiedFilters
        }
      }

      if(gridDataState?.sort?.length){
        const modifiedSort = gridDataState?.sort.map((item) => {
          return {
            ...item,
            field: camelToPascal(reverseKeyMap(columnTitleMap)[item.field])
          }
        });

        updatedGridState = {
          ...updatedGridState,
          sort: modifiedSort
        }
      }



      // debugger


      const modifiedGridState = { ...gridDataState, ...updatedGridState }

      const resposne = await APIService.fetchGridData('GetGridData', modifiedGridState);
      if (resposne.data) {

        const modifiedDate = resposne.data.map((item) => {
          const newItem: Record<string, any> = {};

          Object.keys(item).forEach((key) => {
            const newKey = columnTitleMap[key] || key;
            newItem[newKey] = item[key];
          });

          return newItem;
        })

        const modifiedGridState = {
          ...gridDataState,
          skip: 0
        }


        const processedData = processWithGroups(modifiedDate, modifiedGridState);
        // debugger

        setVendorData(processedData.data)

        setGridDataState((prev) => {
          return {
            ...prev,
            total: resposne.total
          }
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getTableData();

  }, [gridDataState.filter, gridDataState.sort, gridDataState.take, gridDataState.skip, gridDataState.group])

  // useEffect(() => {
  //   // Call API 
  //   getTableData();
  //   return () => {
  //     // 
  //   }
  // }, [])






  const handleDataStateChange = (e: any) => {
    // debugger
    setGridDataState((prev) => {
      return {
        ...prev,
        ...e.dataState
      };
    });


  };

  const handleGridColumnStateChange = (e) => {
  
    const modifiedColumnState = e.columnsState;
    setColumnsState((prev) => {

      return prev.map((item) => {
        const modifiedColumnField = modifiedColumnState.find(modifiedItem => modifiedItem.field === item.field  );
        const modifiedFieldContent = modifiedColumnField || {};
        return {
          ...item,
          ...modifiedFieldContent
        }
      })


    })
  }

  const [group, setGroup] = useState([]);
  const [groupExpand, setGroupExpand] = useState([])

  const handleGroupChange = (e) => {
    // debugger
    // debugger
    const modifiedGroup = e.group.map((item) => {
      return {
        ...item,
      }
    })
    setGroup(modifiedGroup);
    setGridDataState((prev) => {
      return {
        ...prev,
        group: modifiedGroup
      }
    })
  }

  const handleGroupExpandChange = (e) => {

    setGroupExpand(e.groupExpand)
  }


  useEffect(() => {
    // debugger
    setColumnsState((prev) => {
      // debugger
      const groupFields = group.map((g) => g.field);
      return prev.map((col) => {
        const hidden = groupFields.includes(col.field);
        return {
          ...col,
          hidden,
          columnHidden: hidden,
          disabled: hidden
        }
      })
    })
  }, [group])

  function flattenAndSortColumns(columns: TableColumn[]): TableColumn[] {
    let flattened: TableColumn[] = [];

    // Recursive helper to collect leaf columns
    function collectLeafColumns(cols: TableColumn[]) {
      cols.forEach(col => {
        if (col.field) {
          // If it has a 'field', it's a leaf column, add it to the flattened list
          flattened.push(col);
        }
        if (col.children && col.children.length > 0) {
          // If it has 'children', it's a group, recurse into its children
          collectLeafColumns(col.children);
        }
      });
    }

    // Start collecting from the top-level columns
    collectLeafColumns(columns);

    // Sort the flattened list by orderIndex
    // Columns without an orderIndex will be placed at the end or according to their relative order if numbers are mixed with undefined.
    // To ensure undefined are always last, we handle them explicitly.
    // flattened.sort((a, b) => {
    //   if (a.orderIndex === undefined && b.orderIndex === undefined) {
    //     return 0; // Maintain original relative order if both are undefined
    //   }
    //   if (a.orderIndex === undefined) {
    //     return 1; // 'a' (undefined) comes after 'b'
    //   }
    //   if (b.orderIndex === undefined) {
    //     return -1; // 'a' comes before 'b' (undefined)
    //   }
    //   return a.orderIndex - b.orderIndex;
    // });

    return flattened;
  }
  const handleColumnReorder = useCallback((e: any) => {
    console.log(columnsState)
    
    
    const flatternColumns = flattenAndSortColumns(e.columns);
    const existingColumns = columnsState || [];
    const updatedColumns = flatternColumns.map((col, index) => {
      const existingData = columnsState.find(c => c.field === col.field);
      return {
        ...existingData,
        orderIndex: index,
        originalOrderIndex: col.orderIndex,
      }
    });

    // const sortedUpdatedColumn = updatedColumns.sort((a, b) => {
    //   if (a.orderIndex === undefined && b.orderIndex === undefined) {
    //     return 0; // Maintain original relative order if both are undefined
    //   }
    //   if (a.orderIndex === undefined) {
    //     return 1; // 'a' (undefined) comes after 'b'
    //   }
    //   if (b.orderIndex === undefined) {
    //     return -1; // 'a' comes before 'b' (undefined)
    //   }
    //   return a.orderIndex - b.orderIndex;
    // })

    setColumnsState(updatedColumns)

    setGridDataState(prev => {
      return {
        ...prev,
        columns: updatedColumns
      }
    });
  }, []);

  // Recursive function to find and update column width
  const getColumnTitleFromModified = useCallback((
    columns: any,
    targetId: string | number,
    newWidth: number | string
  ): string | undefined => {
    for (const col of columns) {
      // Base match
      if (col.id === targetId || col.field === targetId) {
        return col.field;
      }

      // Recurse into child columns if present
      const childColumns = col.children || col.columns;
      if (childColumns) {
        const result = getColumnTitleFromModified(childColumns, targetId, newWidth);
        if (result) return result;
      }
    }

    // Not found
    return undefined;

  }, []); // No dependencies as it operates on its arguments

  const updateOriginalWithModified = (toBeUpdateColumn, fieldName, newWidth) => {
    return toBeUpdateColumn.map(col => {
      // If this is the column to update, change its width
      let modifiedCol = {...col}
      if (modifiedCol.field === fieldName) {
        return { ...modifiedCol, width: newWidth };
      }
      // Return the column as is if not the target
      return modifiedCol;
    });
  }

  const handleColumnResize = useCallback((e: GridColumnResizeEvent) => {
    

    // // debugger
    // const { columns: resizeColumns, targetColumnId = '', newWidth } = e;


    // const fieldName = getColumnTitleFromModified(resizeColumns, targetColumnId, newWidth);

    // // map columns with update columns 
    // const updatedColumns = updateOriginalWithModified(columnsState, fieldName, newWidth);
    // // debugger
    // setColumnsState(updatedColumns);

    // setGridDataState(prev => {
    //   return {
    //     ...prev,
    //     columns: updatedColumns
    //   };
    // });
  }, []); // Dependency on updateColumnWidth

  const [stimulsProperties, setStimulusProperties] = useState({})


  const generateJSON = async () => {
    
    const tempColumnsState = [...columnsState]

    const modifiedColumns = [...tempColumnsState].map((item) => {
      const { children, ...restItem} = item
      return {
        ...restItem,
        field: reverseKeyMap(columnTitleMap)[item.field],
        width: parseInt(item.width)
      }
    })
    const tempModifiedGroups = [...(gridDataState?.group || [])]
    const modifiedGroups = [...tempModifiedGroups].map((item) => {
      return {
        ...item,
        field: reverseKeyMap(columnTitleMap)[item.field]
      };
    })


    const { columns: existingColumns, group: existngGroups, ...restGridState } = {
      ...gridDataState
    };
    const output = {
      ...restGridState,
      columns: [...modifiedColumns],
      group: modifiedGroups
    };



    try {
      setLoading(true);
      // debugger
      const response = await APIService.generateReport(`GenerateReport`, output);
      if (response) {
        const { action, actionViewerEvent, requestUrl, requestId } = response;
        setStimulusProperties({
          action,
          requestUrl,
          requestId
        })
        setShowReportDrawer(true)
      }
    } catch (e) {
      // debugger
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 100)
    }

  };



  const initialFilter: CompositeFilterDescriptor = {
    logic: 'and',
    filters: []
  }
  const [filter, setFilter] = React.useState<CompositeFilterDescriptor>(initialFilter);
  const [tempFilter, setTempFilter] = React.useState<CompositeFilterDescriptor>(initialFilter);
  const onFilterChange = (event: FilterChangeEvent) => {

    setTempFilter(event.filter);
    if (!event.filter.filters.length) { // Empty filter, reset 
      // If empty then set 
      setFilter(event.filter);
      setGridDataState((prev) => ({
        ...prev,
        filter: event.filter
      }))
    }
  };

  const handleFiltering = () => {

    setFilter(tempFilter)
    setGridDataState((prev) => ({
      ...prev,
      filter: tempFilter,
    }));
  }

  let filteredEmployees = filterBy(vendorData, filter);

  const handleColumnChange = useCallback((PXcolumns) => {
    // return 
    // debugger
    const modifiedColumns = columns.map((item, index) => {
      return {
        ...item,
        hidden: PXcolumns[index].hidden,
        columnHidden: PXcolumns[index].columnHidden
      };
    });
    setColumns(modifiedColumns);
    // setGridDataState((prev) => {
    //   return {
    //     ...prev,
    //     columns: modifiedColumns
    //   }
    // })
  }, [])

  const handleColumnStateChange = (PXcolumns) => {
       // debugger
       const modifiedColumns = columnsState.map((item, index) => {
        return {
          ...item,
          hidden: PXcolumns[index].hidden,
          columnHidden: PXcolumns[index].columnHidden
        };
      });
      setColumnsState(modifiedColumns);
      setGridDataState((prev) => {
        return {
          ...prev,
          columns: modifiedColumns
        }
      })
  }

  useEffect(() => {
    console.log(columnsState)
    
  }, [columnsState])


  const filterFieldTypeMapper: {
    [key: string]: { filter: typeof TextFilter | typeof NumericFilter | typeof DateFilter, operator: any }
  } = {
    "Order Number": { filter: TextFilter, operator: Operators.text },
    "Item Code": { filter: TextFilter, operator: Operators.text },
    "Item Description": { filter: TextFilter, operator: Operators.text },
    "Quantity": { filter: NumericFilter, operator: Operators.numeric },
    "Unit Price": { filter: NumericFilter, operator: Operators.numeric },
    "Vendor Name": { filter: TextFilter, operator: Operators.text },
    "Vendor Code": { filter: TextFilter, operator: Operators.text },
    "Vendor Contact": { filter: TextFilter, operator: Operators.text },
    "Ordered Date": { filter: DateFilter, operator: Operators.date },
    "Order Status": { filter: TextFilter, operator: Operators.text },
    "Line Amount": { filter: NumericFilter, operator: Operators.numeric }
  }

  const vendorFilter = useMemo(() => {


    return columnsState.map((item) => {

      let fieldOperator = Operators.text;
      let fieldFilter: typeof TextFilter | typeof NumericFilter | typeof DateFilter = TextFilter;
      if (filterFieldTypeMapper[String(item?.field)]) {
        const { filter: mapperFilter, operator: mapperOperator } = filterFieldTypeMapper[String(item?.field)];
        fieldOperator = mapperOperator || Operators.text;
        fieldFilter = mapperFilter || TextFilter
      }
      return {
        name: item.field,
        label: item.title,
        filter: fieldFilter,
        operators: fieldOperator
      }
    })
  }, [columnsState])



  const { columns: gridColumns, ...requiredGridDataState } = gridDataState
  // const processedData = process(vendorData?.data || [], requiredGridDataState)


  useEffect(() => {
    // debugger
  }, [gridDataState, columns, columnsState])


  const grid = (
    <div>
      <div className="card">
        <div className="card-header">
          <React.Fragment>
            <GridLayout cols={[{ width: 'calc(100% - 260px)' }, { width: 260 }]} align={{ vertical: 'middle' }}>
              <GridLayoutItem>
                <Filter
                  className='datagrid-filter-element'
                  value={tempFilter}
                  onChange={onFilterChange}
                  fields={vendorFilter}
                />
              </GridLayoutItem>
              <GridLayoutItem>
                <GridLayout cols={[{ width: '120px' }, { width: '140px' }]}>
                  <GridLayoutItem>
                    <Button svgIcon={filterIcon} onClick={handleFiltering}>Filter</Button>
                  </GridLayoutItem>
                  <GridLayoutItem>
                    <div>
                      <PxColumnSelectionPopup show={showPopup} anchor={anchor?.current?.element ?? null}
                        columnsState={columnsState} columns={columns} setColumns={handleColumnChange} setColumnsState={handleColumnStateChange}
                        onClose={() => {
                          setShowPopup(false)
                        }} />
                      <Button themeColor={`primary`} svgIcon={listUnorderedSquareIcon} ref={anchor} onClick={() => setShowPopup((prev) => !prev)} >
                        Selection
                      </Button>
                    </div>
                  </GridLayoutItem>
                </GridLayout>

              </GridLayoutItem>
            </GridLayout>
          </React.Fragment>
        </div>
        <div className="card-body">
          <>



            <Grid
              style={{ height: 'calc(100vh - 260px)' }}
              dataItemKey={DATA_ITEM_KEY}
              autoProcessData={true}
              data={vendorData}
              columnsState={columnsState}
              sortable={{
                mode: 'multiple'
              }}
              pageable={{ pageSizes: true }}
              groupable={{
                enabled: true,
                footer: 'visible',

              }}
              selectable={true}
              filterable={true}
              reorderable={true} // ✅ enable column drag
              resizable={true}   // ✅ enable column resize

              skip={0}
              take={gridDataState.take}
              sort={gridDataState.sort}
              filter={gridDataState.filter}
              total={parseInt(gridDataState?.total || 100)}

              groupExpand={groupExpand}
              onDataStateChange={handleDataStateChange}
              onColumnsStateChange={handleGridColumnStateChange}
              onGroupChange={handleGroupChange}
              onColumnReorder={handleColumnReorder}
              onColumnResize={handleColumnResize}
              onGroupExpandChange={handleGroupExpandChange}
            >


              {
                columnsState.length > 0 ? columnsState.map((column, index) => {

                  return (
                    <Column key={`${index}-${column?.id}`}
                      field={column.field}
                      columnMenu={ColumnMenu}
                      title={column.title}
                      filterable={false}
                      hidden={column?.columnHidden}
                      resizable={true}
                      groupable={true}
                      width={column.width}
                      className={column.className}
                      headerClassName={column.headerClassName}
                      cells={
                        {
                          data: column.cell
                        }
                      }

                    />
                  )
                }) : []
              }
            </Grid>
          </>
        </div>
      </div>



    </div>);

  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const handleReportDrawerClose = () => {
    setShowReportDrawer(false);
    getTableData();
  }




  const StimViewerWrapperMemo = useMemo(() => {
    return (
      <div className='w-full h-full'>
        <StimViewerWrapper
          requestUrl={`${stimulsProperties?.requestUrl}{action}`}
          action={`${stimulsProperties?.action}`}
          height='800px'
          onReady={() => {
            console.log('REad completed')
          }}
        />

      </div>
    )
  }, [stimulsProperties]);

  const [isLandScape, setIsLandScape] = useState(false)
  const handleOrientationChange = () => {
    setIsLandScape((prev) => !prev);
  }
  /**
   * @description When orientation changes 
   */
  useEffect(() => {
    setGridDataState((prev) => {
      return {
        ...prev,
        IsLandscape: isLandScape
      }
    })
  }, [isLandScape])

  return (
    <>
      <div className='employee-inner-page'>
        <div>
          <nav className="navbar navbar-light bg-light justify-content-between mb-3 pb-3 pt-3">
            <div className="container-fluid">
              <a className="navbar-brand" href="#">StimulSOft Reporting</a>
              <div>
                <div className='top-toolbar-wrapper'>
                  <ul className='top-toolbar'>
                    <li>
                      <Button themeColor={`primary`} svgIcon={PreviewIcon} onClick={generateJSON}>Preview</Button>
                    </li>
                    <li>
                      Landscape Mode
                      &nbsp;
                      <Switch checked={isLandScape} onLabel={'Yes'} offLabel={'No'} onChange={handleOrientationChange} />
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </nav>

          <div className='container-fluid'>
            <div className="row">
              <div className="col-12">
                {grid}
              </div>
            </div>
          </div>

          {/* Replace Window with a valid React component or remove it if not needed */}

        </div>
        <div>
          {
            (showReportDrawer) && createPortal(
              (
                <Window title="Report"
                  className='report-window-drawer' top={0}
                  style={{ width: '75dvw', height: '100dvh', left: 'auto', top: 0, right: 0, position: 'fixed' }}
                  onClose={handleReportDrawerClose}
                >
                  {StimViewerWrapperMemo}
                </Window>
              ),
              document.body
            )
          }
        </div>
        <FullScreenLoader loading={loading} />
      </div>
    </>
  );
};

export default Employees;
