import { Client } from "@notionhq/client";
import {
  DatabaseObjectResponse,
  PageObjectResponse,
  UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";

// passing notion client to the option

export const getPageMarkdown = async (client: Client, pageId: string) => {
  const n2m = new NotionToMarkdown({ notionClient: client });
  const mdblocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdblocks);
  return mdString.parent;
};

export const getDatabase = async (
  client: Client,
  databaseId: string
): Promise<DatabaseObjectResponse> => {
  const response = await client.databases.retrieve({ database_id: databaseId });
  return response as DatabaseObjectResponse;
};

export const getRecords = async (client: Client, databaseId: string) => {
  const response = await client.databases.query({
    database_id: databaseId,
  });
  return response.results;
};

export const properties2Object = (
  properties: PageObjectResponse["properties"]
) => {
  let title: string | undefined;
  const entry = Object.entries(properties).map(([key, value]) => {
    // code below is co-authored with Github Copilot
    switch (value.type) {
      case "title":
        title = value.title[0]?.plain_text;
        return [key, value.title[0]?.plain_text];
      case "rich_text":
        return [key, value.rich_text[0]?.plain_text];
      case "date":
        return [key, value.date?.start];
      case "select":
        return [key, value.select?.name];
      case "multi_select":
        return [key, value.multi_select?.map((item) => item.name).join(", ")];
      case "status":
        return [key, value.status?.name];
      case "number":
        return [key, value.number];
      case "people":
        return [
          key,
          value.people?.map((item) => (item as UserObjectResponse).name),
        ];
      case "files":
        return [key, value.files?.map((item) => item.name).join(", ")];
      case "checkbox":
        return [key, value.checkbox];
      case "url":
        return [key, value.url];
      case "email":
        return [key, value.email];
      case "phone_number":
        return [key, value.phone_number];
      case "formula":
        switch (value.formula.type) {
          case "string":
            return [key, value.formula.string];
          case "number":
            return [key, value.formula.number];
          case "boolean":
            return [key, value.formula.boolean];
          case "date":
            return [key, value.formula.date?.start];
        }
        break;
      case "relation":
        return [key, value.relation?.map((item) => item.id).join(", ")];
      case "rollup":
        switch (value.rollup.type) {
          case "number":
            return [key, value.rollup.number];
          case "date":
            return [key, value.rollup.date?.start];
          case "array":
            return [key, value.rollup.array];
        }
        break;
      case "created_time":
        return [key, value.created_time];
      case "created_by":
        return [key, (value.created_by as UserObjectResponse).name];
      case "last_edited_time":
        return [key, value.last_edited_time];
      case "last_edited_by":
        return [key, (value.last_edited_by as UserObjectResponse)?.name];
      default:
        return [key, value];
    }
  });
  return {
    title,
    data: Object.fromEntries(entry),
  };
};

type DatabasePropertyConfigResponse = Awaited<
  ReturnType<typeof getDatabase>
>["properties"];

enum FieldType {
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

const notion2EidosTypeMap: {
  [notionType: string]: FieldType;
} = {
  title: FieldType.Title,
  text: FieldType.Text,
  rich_text: FieldType.Text,
  number: FieldType.Number,
  checkbox: FieldType.Checkbox,
  created_time: FieldType.Date,
  last_edited_time: FieldType.Date,
  date: FieldType.Date,
  files: FieldType.File,
  multi_select: FieldType.MultiSelect,
  rating: FieldType.Rating,
  select: FieldType.Select,
  url: FieldType.URL,
  // formula: FieldType.Formula,
};

const ColumnTableName = `eidos__columns`;
export const generateColumnName = () => {
  // random 4 characters
  return `cl_${Math.random().toString(36).substring(2, 6)}`;
};

export const transformDatabaseSchema = (data: {
  tableId: string;
  title: string;
  properties: DatabasePropertyConfigResponse;
}): {
  name: string;
  createTableSql: string;
  fields: {
    name: string;
    type: FieldType;
    table_name: string;
    table_column_name: string;
    property: unknown;
  }[];
} => {
  const { tableId, title, properties } = data;
  // uuid
  const rawTableName = `tb_${tableId}`;

  // table base sql
  let sql = `CREATE TABLE ${rawTableName} (_id TEXT PRIMARY KEY NOT NULL,title TEXT NULL);\n`;
  // let sql = `CREATE TABLE ${rawTableName} (_id TEXT PRIMARY KEY NOT NULL);\n`;
  sql += `INSERT INTO ${ColumnTableName}(name, type, table_name, table_column_name) VALUES ('_id', 'row-id', '${rawTableName}', '_id');\n`;
  sql += `INSERT INTO ${ColumnTableName}(name, type, table_name, table_column_name) VALUES ('title', 'title', '${rawTableName}', 'title');\n`;

  const fields = Object.values(properties).map((property) => {
    const { type } = property;
    const eidosFieldType = notion2EidosTypeMap[type] || FieldType.Text;
    const rawColumnName = generateColumnName();
    let fieldProperty = null;
    if (type === "multi_select" || type === "select" || type === "status") {
      fieldProperty = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (property as any)[type]?.options,
      };
    }
    return {
      name: property.name,
      type: eidosFieldType,
      table_name: rawTableName,
      table_column_name: rawColumnName,
      property: fieldProperty,
    };
  });

  // TODO: we need a rpc method to create a database with given columns
  return {
    name: title,
    createTableSql: sql,
    fields,
  };
};
