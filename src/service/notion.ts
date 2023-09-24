import { Client } from "@notionhq/client";

export const getDatabaseSchema = async (client: Client, databaseId: string) => {
  const response = await client.databases.retrieve({ database_id: databaseId });
  return response.properties;
};

export const createDatabase = (data: {
  title: string;
  properties: Awaited<ReturnType<typeof getDatabaseSchema>>;
}) => {
  const { title } = data;
  console.log(title);
  // TODO: we need a rpc method to create a database with given columns
};
