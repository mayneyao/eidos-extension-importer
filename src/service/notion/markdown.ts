import { Client } from "@notionhq/client";
import { ImageBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";
import { Eidos } from "@eidos.space/types";

declare const eidos: Eidos;
// passing notion client to the option

export const getNotion2Markdown = (notionClient: Client) => {
  const n2m = new NotionToMarkdown({ notionClient });
  const spaceName = localStorage.getItem("spaceName")?.replace(/"/g, "");
  if (!spaceName) {
    throw new Error("spaceName is required");
  }
  n2m.setCustomTransformer("image", async (block) => {
    const { image } = block as ImageBlockObjectResponse;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caption = await n2m.blockToMarkdown((image?.caption as any) || []);

    if (image.type === "external") {
      return `![${caption}](${image.external.url})`;
    }
    const fileId = crypto.randomUUID().replace(/-/g, "");
    const eFile = await eidos
      .space(spaceName)
      .saveFile2EFS(image.file.url, ["images"], fileId);
    // spaces/<spaceName>/files/abc.jpg => /<spaceName>/files/abc.jpg
    const url = eFile?.path.replace("spaces/", "");
    return `![${caption}](/${url})`;
  });
  return n2m;
};
