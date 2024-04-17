/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@notionhq/client";

import { sleep } from "@/lib/utils";
import { Eidos } from "@eidos.space/types";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { useState } from "react";
import {
  getDatabase,
  getPageMarkdown,
  getRecords,
  properties2Object,
  transformDatabaseSchema,
} from ".";
declare const eidos: Eidos;

export const useNotionImporter = (props: {
  databaseId: string | undefined;
  notionToken: string | undefined;
  spaceName: string | undefined;
  withPageContent?: boolean;
  addLog: (log: any) => void;
}) => {
  const {
    databaseId,
    notionToken,
    spaceName,
    withPageContent = false,
    addLog,
  } = props;
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [maxCount, setMaxCount] = useState(0);

  const handleImport = async () => {
    addLog({
      date: new Date().toISOString(),
      level: "INFO",
      message: "Import started",
    });
    if (!databaseId || !spaceName || !notionToken) {
      return addLog({
        date: new Date().toISOString(),
        level: "WARN",
        message: "databaseId, spaceName, notionToken is required",
      });
    }
    setLoading(true);
    const client = new Client({
      auth: notionToken,
      baseUrl: "https://notion-api-proxy.eidos.space",
    });
    const database = await getDatabase(client, databaseId);
    const records = await getRecords(client, databaseId, undefined, (msg) => {
      addLog({
        date: new Date().toISOString(),
        level: "INFO",
        message: msg,
      });
    });
    addLog({
      date: new Date().toISOString(),
      level: "INFO",
      message: `Got ${records.length} records from Notion database`,
    });
    setMaxCount(records.length);
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
      addLog({
        date: new Date().toISOString(),
        level: "INFO",
        message: `Table tb_${databaseId} already exists, skipping table creation`,
      });
    } else {
      const res2 = transformDatabaseSchema({
        tableId: databaseId,
        title: database.title.map((r) => r.plain_text).join(""),
        properties: database.properties,
      });
      addLog({
        date: new Date().toISOString(),
        level: "INFO",
        message: `Creating table tb_${databaseId}`,
      });
      addLog({
        date: new Date().toISOString(),
        level: "DEBUG",
        message: `createTableSql: ${res2.createTableSql}`,
      });
      // create table
      await space.createTable(databaseId, res2.name, res2.createTableSql);
      // add fields
      for (const field of res2.fields) {
        if (field.type !== "title") {
          await space.addColumn(field);
          addLog({
            date: new Date().toISOString(),
            level: "INFO",
            message: `Added column ${field.name} to table tb_${databaseId}`,
          });
        }
      }
    }

    // wait 1s for table creation
    await sleep(1000);
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
        addLog({
          date: new Date().toISOString(),
          level: "INFO",
          message: `Added row ${docId} to table tb_${databaseId}`,
        });
        if (withPageContent) {
          // create subDoc with markdown
          const mdString = await getPageMarkdown(client, record.id);
          if (mdString?.length) {
            await space.createOrUpdateDocWithMarkdown(
              docId,
              mdString,
              databaseId,
              recordObj.title
            );
            addLog({
              date: new Date().toISOString(),
              level: "INFO",
              message: `Added doc ${docId} to table tb_${databaseId}`,
            });
          }
          await sleep(100);
        }
      } catch (error) {
        addLog({
          date: new Date().toISOString(),
          level: "WARN",
          message: `Failed to add row ${docId}, waiting 2s`,
        });
        console.warn("Failed to add row", record.id, error);
        await sleep(2000);
      } finally {
        setCount((c) => c + 1);
      }
    }
    setLoading(false);
  };

  return {
    handleImport,
    loading,
    count,
    maxCount,
  };
};
