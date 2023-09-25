/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Input } from "@/components/ui/input";
import { Client } from "@notionhq/client";
import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import {
  getDatabase,
  getPageMarkdown,
  getRecords,
  properties2Object,
  transformDatabaseSchema,
} from "./service/notion";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [loading, setLoading] = useState(false);
  const [notionToken, setNotionToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const handleImport = async () => {
    setLoading(true);
    const client = new Client({
      auth: notionToken,
      baseUrl: "https://notion-api-proxy.eidos.space",
    });
    const database = await getDatabase(client, databaseId);
    const records = await getRecords(client, databaseId);
    console.log(records);
    const space = eidos.space("notion2");
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
        let data = properties2Object((record as PageObjectResponse).properties);
        // remove value is null/undefined/false
        data = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v != null && v !== false)
        );
        const rowData = { _id: record.id, ...data };
        await space.addRow(`tb_${databaseId}`, rowData);
        console.log(`add row ${docId} success`);

        // create subDoc with markdown
        const mdString = await getPageMarkdown(client, record.id);
        if (mdString.length) {
          await space.createOrUpdateDocWithMarkdown(docId, mdString);
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
  return (
    <>
      <div className="flex flex-col gap-2 max-w-md">
        <Input
          type="text"
          placeholder="Notion Token"
          value={notionToken}
          onChange={(e) => setNotionToken(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Database ID"
          value={databaseId}
          onChange={(e) => setDatabaseId(e.target.value)}
        />
        <Button onClick={handleImport} disabled={loading}>
          Import
        </Button>
      </div>
    </>
  );
}

export default App;
