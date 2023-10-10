import { Input } from "@/components/ui/input";
import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { useNotionImporter } from "./service/notion/hooks";

function App() {
  const [notionToken, setNotionToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const { handleImport, loading } = useNotionImporter(databaseId, notionToken);

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
