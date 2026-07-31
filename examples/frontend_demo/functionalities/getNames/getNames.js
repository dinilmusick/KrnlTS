import { z } from "zod";

export const getNamesAtom = {
  id: "getNames",
  method: "GET",
  visibility: "public",
  uiSpec: {
    ui_component_enabled: true,
    ui_component_type: "form",
    outputs: [
      {
        field: "names",
        component: "KrnlDropdown",
        label: "Available Usernames",
        sharedComponentId: "nameSelector",
        dataPath: "names",
        autoFetch: true
      }
    ]
  },
  schema: {
    input: z.object({})
  },
  api: async () => {
    return {
      names: ["Alice", "Bob", "Charlie", "Diana"]
    };
  }
};

export default getNamesAtom;
