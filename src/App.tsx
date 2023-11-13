import { Input } from "@/components/ui/input";
import { Button } from "./components/ui/button";
import { useNotionImporter } from "./service/notion/hooks";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

import { useLocalStorageState } from "ahooks";
import { useLogStore } from "./components/component/store";
import { LogViewer } from "./components/component/log-viewer";

function App() {
  const [notionToken, setNotionToken] =
    useLocalStorageState<string>("notionToken");
  const [databaseId, setDatabaseId] =
    useLocalStorageState<string>("databaseId");
  const [withPageContent, setWithPageContent] =
    useLocalStorageState<boolean>("withPageContent");
  const { addLog } = useLogStore();
  const [spaceName, setSpaceName] = useLocalStorageState<string>("spaceName");
  const { handleImport, loading, count, maxCount } = useNotionImporter({
    databaseId,
    notionToken,
    spaceName,
    withPageContent,
    addLog,
  });

  return (
    <div className="container p-4 grid gap-4">
      <div className="flex flex-col gap-2 max-w-md" id="form">
        <Input
          type="text"
          placeholder="Space"
          value={spaceName}
          onChange={(e) => setSpaceName(e.target.value)}
        />
        <Input
          type="password"
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
        <div className="flex items-center space-x-2">
          <Switch
            id="withPageContent"
            checked={withPageContent}
            onCheckedChange={setWithPageContent}
          />
          <label htmlFor="withPageContent">With Page Content</label>
        </div>
        <Button onClick={handleImport} disabled={loading}>
          Import
        </Button>
      </div>
      <div className="w-full">
        {loading && <Progress value={count} max={maxCount} />}
        <LogViewer />
      </div>
    </div>
  );
}

export default App;
