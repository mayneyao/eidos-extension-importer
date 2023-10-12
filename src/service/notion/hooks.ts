/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { useState } from "react";
import {
  getDatabase,
  getRecords,
  transformDatabaseSchema,
  properties2Object,
  getPageMarkdown,
} from ".";
import { sleep } from "@/lib/utils";

export const useNotionImporter = (
  databaseId: string | undefined,
  notionToken: string | undefined,
  spaceName: string | undefined
) => {
  const [loading, setLoading] = useState(false);
  const handleImport = async () => {
    if (!databaseId || !spaceName || !notionToken) {
      return console.warn("databaseId, spaceName, notionToken is required");
    }
    setLoading(true);
    const client = new Client({
      auth: notionToken,
      baseUrl: "https://notion-api-proxy.eidos.space",
    });
    const database = await getDatabase(client, databaseId);
    const records = await getRecords(client, databaseId);
    console.log(records);
    const space = eidos.space(spaceName);
    const isTableExist = await space.isTableExist(databaseId);
    let idSet: Set<string> = new Set();
    if (isTableExist) {
      //
      const rows = await space.sqlQuery(
        `select _id from tb_${databaseId}`,
        [],
        "object"
      );
      idSet = new Set(rows.map((r: any) => r._id));
      console.log("table exist, skip create table");
    } else {
      const res2 = transformDatabaseSchema({
        tableId: databaseId,
        title: database.title.map((r) => r.plain_text).join(""),
        properties: database.properties,
      });
      console.log(res2.createTableSql);
      // create table
      await space.createTable(databaseId, res2.name, res2.createTableSql);
      // add fields
      for (const field of res2.fields) {
        await space.addColumn(field);
        console.log(`add column ${field.name} success`);
      }
    }

    // add rows
    for (const record of records) {
      const docId = record.id.split("-").join("");
      if (idSet.has(record.id)) {
        continue;
      }
      try {
        const recordObj = properties2Object(
          (record as PageObjectResponse).properties
        );
        let data = recordObj.data;
        // remove value is null/undefined/false
        data = Object.fromEntries(
          Object.entries(recordObj.data).filter(
            ([_, v]) => v != null && v !== false
          )
        );
        const rowData = { _id: record.id, ...data };
        await space.addRow(`tb_${databaseId}`, rowData);
        console.log(`add row ${docId} success`);

        // create subDoc with markdown
        const mdString = await getPageMarkdown(client, record.id);
        if (mdString.length) {
          await space.createOrUpdateDocWithMarkdown(
            docId,
            mdString,
            databaseId
          );
          console.log(`add doc ${docId} success`);
        }
      } catch (error) {
        console.warn(`add row ${docId} failed, wait 2s`);
        sleep(2000);
      }
      sleep(1000);
    }
    setLoading(false);
  };

  return {
    handleImport,
    loading,
  };
};
