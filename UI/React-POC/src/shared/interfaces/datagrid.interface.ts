import {
    GridColumnState,
    GridDataType,
    GridProps,
    GridSearchBoxChangeEvent,
    GridPagerSettings,
  } from '@progress/kendo-react-grid';
  // import { ButtonHandle } from '@progress/kendo-react-buttons';
  
  export interface IGridColumn {
    locked?: boolean;
    field?: string; // The field name in the data source
    title: string; // The display title for the column
    width?: string; // Optional width for the column
    sortable?: boolean; // Whether the column is sortable
    filterable?: boolean; // Whether the column is filterable
    cell?: any;
    menu?: boolean; // Whether to show the column menu
    columnHidden?: boolean; // wheather to show the column
    mandatoryColumn?: boolean; // Whether the column is mandatory
    id?: string;
    editable?: boolean; // Whether the column is editable
    editor?: GridDataType; // Custom editor for the column
    type?: string; // Type of the column (e.g., 'string', 'number', etc.)
    actions?: string[]; // Array of action keys to determine which actions to show
    icon?: boolean; // Whether to show an icon in the column
  }
  
  export interface IDataItem {
    [key: string]: any | number; // Generic data item structure, can be extended as needed
  }
  
  export interface IGridPageable {
    skip: number; // Number of items to skip (for pagination)
    take: number; // Number of items to take (for pagination)
  }
  
  export interface IGridDataProps extends GridProps {
    apiRoute: string; // The API route to fetch data from
    columns: Array<IGridColumn>;
    pageSize?: number;
    pageable?: boolean | GridPagerSettings;
    searchable?: boolean;
    serverSide: boolean; // Flag to enable or disable server-side pagination}
    columnSelection?: boolean; // Flag to enable or disable column selection,
    setColumns: (columns: IGridColumn[]) => void; // Function to set the columns state
    onRowDoubleClick?: (event: IDataItem) => void; // Optional callback for row double-click event
    showCheckboxColumn?: boolean; // Flag to show checkbox column for row selection
    classname?: string; // Optional class name for custom styling
    onEdit?: (dataItem: IDataItem) => void; // Optional callback for edit action
    externalIcon?: boolean; // Flag to show external icon for links
    headerName: string; // The name of the header for the grid
    addAction?: () => void; // Flag to show add action button
    onStatusChange?: (dataItem: any, status: any) => void;
    overview?: boolean; // Flag to show overview mode
    openInNewTab?: boolean; // Flag to open in new tab
    clearSort?: boolean;
    onNotesChange?: (dataItem: IDataItem) => void; // Optional callback for notes change action
    hideToolbar?: boolean; // Flag to hide toolbar
    handleRowClick?: (id: string) => void; // Optional callback for row click event
  }
  
  export interface ISortDescriptor {
    field: string; // The field to sort by
    dir: 'asc' | 'desc'; // The direction of sorting: 'asc' for ascending, 'desc' for descending
  }
  
  export interface IFilterDescriptor {
    field: string; // The field to filter by
    operator: string; // The operator to use for filtering (e.g., 'eq', 'contains', etc.)
    value: any; // The value to filter by
  }
  
  export interface ICompositeFilterDescriptor {
    logic: 'and' | 'or'; // Logical operator to combine filters
    filters: Array<IFilterDescriptor | ICompositeFilterDescriptor>; // Nested filters or composite filters
  }
  
  export interface GridToolbarContentProps {
    handleSearch: (event: GridSearchBoxChangeEvent) => void;
    search: string | null;
    handleExport?: () => void;
  }
  
  export interface IGridPendingLayout {
    columnsState: IExtendedGridColumnState[];
    filter: any;
    sort: any;
    search: string | null;
    currentPage: { skip: number; take: number };
    name: string;
  }
  
  export type IExtendedGridColumnState = GridColumnState & {
    locked?: boolean;
    columnHidden?: boolean;
    mandatoryColumn?: boolean;
    menu?: boolean; // Add menu property to the type
    actions?: string[]; // Add actions property to the type
    resizable?: boolean; // Add resizable property to the type
    filterable?: boolean; // Add filterable property to the type
    sortable?: boolean; // Add sortable property to the type
    editable?: boolean; // Add editable property to the type
    editor?: GridDataType; // Add editor property to the type
    dataType?: string; // Add dataType property to the type
    type?: string; // Add dataType property to the type
    icon?: boolean; // Add icon property to the type
  };
  
  export interface IGridSavedLayout {
    name: string;
    layout: {
      columnsState: IExtendedGridColumnState[];
      filter: any; // Replace `any` with the appropriate type if available
      sort: any; // Replace `any` with the appropriate type if available
      search: string | null;
      currentPage: { skip: number; take: number };
      layoutName: string;
      isPublic: boolean;
    };
  }
  
  export type IGridTextAlign = 'left' | 'center' | 'right';
  
  export interface IGridExportRequest {
    selectedIds?: (string | number)[];
    columns?: string[];
    filters?: any;
    sort?: any;
    [key: string]: any; // for any additional info
  }
   