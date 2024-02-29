import { z } from "zod";
import { contactSchema } from "./contact.schema";

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  password: z.string(),
  superUser: z.boolean().default(false),
  phone: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  updatedBy: z.string().nullable(),
  contacts: z.array(contactSchema),
});

const userSchemaRequest = userSchema.omit({
  id: true,
  createdAt: true,
  registeredAt: true,
  updatedAt: true,
  updatedBy: true,
  contacts: true,
});

const userSchemaResponse = userSchema.omit({
  password: true,
});

const usersSchemaResponse = z.array(userSchemaResponse);

const userSchemaUpdate = userSchema
  .omit({
    id: true,
    contacts: true,
    superUser: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: true,
  })
  .partial();

const userSchemaUpdateResponse = userSchema.omit({
  contacts: true,
});

const userSchemaSignInResponse = userSchema.pick({
  id: true,
  email: true,
  name: true,
  phone: true,
  password: true,
  superUser: true,
});

const signInSchemaResponse = z.object({
  user: userSchemaSignInResponse,
  token: z.string()
})

const getUserByTokenResponse = userSchema.pick({
  id: true,
  name: true
})

export {
  userSchema,
  userSchemaRequest,
  userSchemaResponse,
  usersSchemaResponse,
  userSchemaUpdate,
  userSchemaUpdateResponse,
  signInSchemaResponse,
  userSchemaSignInResponse,
  getUserByTokenResponse
};
