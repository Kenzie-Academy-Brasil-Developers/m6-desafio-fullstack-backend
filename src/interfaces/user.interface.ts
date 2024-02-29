import { z } from "zod"
import { signInSchemaResponse, userSchema, userSchemaRequest, userSchemaResponse, userSchemaUpdate, userSchemaUpdateResponse, usersSchemaResponse } from "../schemas/user.schema"
import { DeepPartial } from "typeorm"

type TUserRequest = z.infer<typeof userSchemaRequest>
type TUser = z.infer<typeof userSchema>
type TUserResponse = z.infer<typeof userSchemaResponse>
type TUsersResponse = z.infer<typeof usersSchemaResponse>
type TUserUpdateResponse = z.infer<typeof userSchemaUpdateResponse>
type TUserUpdateRequest = DeepPartial<TUserRequest>
type TSignInResponse = z.infer<typeof signInSchemaResponse>


export { TUser, TUserRequest, TUserResponse, TUsersResponse, TUserUpdateRequest, TUserUpdateResponse, TSignInResponse }