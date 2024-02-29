import { compare } from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User } from "../entities/users.entity";
import { AppError } from "../errors/AppError";
import { TLoginRequest } from "../interfaces/login.interface";
import { sign } from "jsonwebtoken";
import { TSignInResponse } from "../interfaces/user.interface";
import { userSchemaSignInResponse } from "../schemas/user.schema";
import { z } from "zod";

type TuserSchemaSignInResponse = z.infer<typeof userSchemaSignInResponse>

export class SessionService {
  async createToken(data: TLoginRequest):Promise<TSignInResponse>{
    const { email, password } = data;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordMatch = await compare(password, user.password);

    if (!isPasswordMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = sign(
      { username: user.name, superUser: user.superUser, id: user.id },
      process.env.SECRET_KEY!,
      { expiresIn: "3h", subject: user.id,}
    );

    const formatedUser: TuserSchemaSignInResponse  = userSchemaSignInResponse.parse(user)

    return {user:formatedUser, token};
  }
}