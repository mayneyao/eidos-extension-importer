import { Input } from "@/components/ui/input";
import { Client } from "@notionhq/client";
import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { getDatabaseSchema } from "./service/notion";

function App() {
  const [notionToken, setNotionToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const handleImport = async () => {
    const client = new Client({
      auth: notionToken,
      baseUrl: "https://notion-api-proxy.eidos.space",
    });
    const res = await getDatabaseSchema(client, databaseId);
    console.log(res);
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
        <Button onClick={handleImport}>Import</Button>
      </div>
    </>
  );
}

export default App;
