/* eslint-disable @typescript-eslint/no-explicit-any */
interface Eidos {
  space(space: string): Space;
  currentSpace: Space;
}

interface ITreeNode {
  id: string;
  name: string;
  type: "table" | "doc" | "subDoc";
  parentId?: string;
  isPinned?: boolean;
}

interface IFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mime: string;
  isVectorized?: boolean;
}

declare enum ViewTypeEnum {
  Grid = "grid",
  Gallery = "gallery",
}
interface IView {
  id: string;
  name: string;
  type: ViewTypeEnum;
  tableId: string;
  query: string;
}

declare enum FieldType {
  Number = "number",
  Text = "text",
  Title = "title",
  Checkbox = "checkbox",
  Date = "date",
  File = "file",
  MultiSelect = "multi-select",
  Rating = "rating",
  Select = "select",
  URL = "url",
  Formula = "formula",
}

declare type IUIColumn = {
  name: string;
  type: FieldType;
  table_column_name: string;
  table_name: string;
  property: any;
};

interface Space {
  sqlQuery(
    sql: string,
    bind?: any[],
    rowMode?: "object" | "array"
  ): Promise<any[]>;
  addFile(file: IFile): Promise<IFile>;
  getFileById(id: string): Promise<IFile>;
  getFileByPath(path: string): Promise<IFile>;
  delFile(id: string): Promise<boolean>;
  delFileByPath(path: string): Promise<boolean>;
  deleteFileByPathPrefix(prefix: string): Promise<boolean>;
  updateFileVectorized(id: string, isVectorized: boolean): Promise<boolean>;
  listViews(tableId: string): Promise<IView[]>;
  addView(view: IView): Promise<IView>;
  delView(viewId: string): Promise<boolean>;
  updateView(viewId: string, view: Partial<IView>): Promise<boolean>;
  createDefaultView(tableId: string): Promise<IView>;
  addColumn(data: IUIColumn): Promise<IUIColumn>;
  listRawColumns(tableName: string): Promise<any>;
  updateColumnProperty(data: {
    tableName: string;
    tableColumnName: string;
    property: any;
    isFormula?: boolean;
  }): Promise<void>;
  addDoc(docId: string, content: string, isDayPage?: boolean): Promise<void>;
  updateDoc(
    docId: string,
    content: string,
    _isDayPage?: boolean
  ): Promise<void>;
  getDoc(docId: string): Promise<any>;
  getDocMarkdown(docId: string): Promise<any>;
  /**
   * if you want to create or update a day page, you should pass a day page id. page id is like 2021-01-01
   * @param docId
   * @param mdStr
   * @returns
   */
  createOrUpdateDocWithMarkdown(
    docId: string,
    mdStr: string
  ): Promise<
    | {
        id: string;
        success: boolean;
        msg?: undefined;
      }
    | {
        id: string;
        success: boolean;
        msg: string;
      }
  >;
  deleteDoc(docId: string): Promise<void>;
  createTable(id: string, name: string, tableSchema: string): Promise<void>;
  listDays(page: number): Promise<
    {
      id: any;
    }[]
  >;
  listAllDays(): Promise<
    {
      id: any;
      content: any;
    }[]
  >;
  listTreeNodes(q?: string, withSubNode?: boolean): Promise<ITreeNode[]>;
  pinNode(id: string, isPinned: boolean): Promise<boolean>;
  updateTreeNodeName(id: string, name: string): Promise<void>;
  addTreeNode(data: ITreeNode): Promise<ITreeNode>;
  getTreeNode(id: string): Promise<ITreeNode>;
  moveDraftIntoTable(id: string, tableId: string): Promise<boolean>;
  listUiColumns(tableName: string): Promise<IUIColumn[]>;
  listAllUiColumns(): Promise<any[]>;
}

declare const eidos: Eidos;
