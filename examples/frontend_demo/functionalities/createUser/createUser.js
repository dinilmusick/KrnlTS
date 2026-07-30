import { z } from "zod";

export const createUserAtom = {
  id: "createUser",
  method: "POST",
  visibility: "public",
  uiSpec: {
    ui_component_enabled: true,
    ui_component_type: "form",
    inputs: [
      { field: "username", component: "KrnlTextInput", label: "Username" },
      { field: "email", component: "KrnlTextInput", label: "Email Address" },
      { field: "age", component: "KrnlNumberInput", label: "Age" },
      { field: "isAdmin", component: "KrnlToggle", label: "Is Administrator?" }
    ],
    outputs: [
      { field: "id", component: "KrnlTile", label: "User ID" },
      { field: "username", component: "KrnlTile", label: "Username" }
    ]
  },
  schema: {
    input: z.object({
      username: z.string().describe("The user's username"),
      email: z.string().email().describe("The user's email address"),
      age: z.number().int().min(18).describe("Must be at least 18"),
      isAdmin: z.boolean().describe("Toggle admin privileges")
    })
  },
  api: async (input, context) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...input,
      createdAt: new Date().toISOString()
    };
  }
};

export default createUserAtom;
