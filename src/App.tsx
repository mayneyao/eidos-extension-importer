import { Input } from "@/components/ui/input";
import "./App.css";
import { Button } from "./components/ui/button";
import { useNotionImporter } from "./service/notion/hooks";

import { useLocalStorageState } from "ahooks";

function App() {
  const [notionToken, setNotionToken] =
    useLocalStorageState<string>("notionToken");
  const [databaseId, setDatabaseId] =
    useLocalStorageState<string>("databaseId");
  const [spaceName, setSpaceName] = useLocalStorageState<string>("spaceName");
  const { handleImport, loading } = useNotionImporter(
    databaseId,
    notionToken,
    spaceName
  );

  return (
    <>
      <div className="flex flex-col gap-2 max-w-md">
        <Input
          type="text"
          placeholder="Space"
          value={spaceName}
          onChange={(e) => setSpaceName(e.target.value)}
        />
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
