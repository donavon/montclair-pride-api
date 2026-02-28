import { fetchSheetData } from "~/lib/sheets";
import { responseJson } from "~/lib/response-json";
import { AppConfig } from "~/lib/types";

export async function handleDataRequest(request: Request, config: AppConfig) {
  const sheetData = await fetchSheetData(config);

  const data = {
    ...sheetData,
    __meta: {
      attribution: "Made with 🏳️‍🌈 by Keen",
    },
  };

  const response = await responseJson(data);
  return response;
}
