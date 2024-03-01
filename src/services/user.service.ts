import { hash } from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User } from "../entities/users.entity";
import {
  TGetUserByTokenResponse,
  TUserRequest,
  TUserResponse,
  TUserUpdateRequest,
  TUserUpdateResponse,
} from "../interfaces/user.interface";
import {
  getUserByTokenResponse,
  userSchemaResponse,
  userSchemaSignInResponse,
  userSchemaUpdateResponse,
  usersSchemaResponse,
} from "../schemas/user.schema";
import { AppError } from "../errors/AppError";
import jsPDF from "jspdf";
import { JwtPayload, verify } from "jsonwebtoken";

export class UserService {
  async create(data: TUserRequest): Promise<TUserResponse> {
    const { email, password, name, superUser, phone } = data;
    const userRepository = AppDataSource.getRepository(User);
    const foundUserByEmail = await userRepository.findOne({
      where: {
        email,
      },
    });

    const foundUserByPhone = await userRepository.findOne({
      where: {
        phone,
      },
    });

    if (foundUserByEmail && foundUserByPhone) {
      throw new AppError("Email and phone already exist", 409);
    }

    if (foundUserByEmail) {
      throw new AppError("Email already exists");
    }

    if (foundUserByPhone) {
      throw new AppError("Phone already exists");
    }

    const hashedPassword = await hash(password, 10);
    const user: User = userRepository.create({
      email,
      name,
      superUser,
      password: hashedPassword,
      phone,
      contacts: [],
    });
    await userRepository.save(user);
    return userSchemaResponse.parse(user);
  }

  async list() {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      relations: {
        contacts: true,
      },
    });
    return usersSchemaResponse.parse(users);
  }

  async listById(userId: string): Promise<TGetUserByTokenResponse> {
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOne({
      where: { id: userId },
      relations: {
        contacts: true,
      },
    });
    if (!userFound) {
      throw new AppError("User not found", 404);
    }
    return userSchemaResponse.parse(userFound);
  }

  async update(
    data: TUserUpdateRequest,
    userId: string,
    tokenId: string
  ): Promise<TUserUpdateResponse> {
    const userRepository = AppDataSource.getRepository(User);
    const userToUpdate = await userRepository.findOne({
      where: { id: userId },
    });
    if (!userToUpdate) {
      throw new AppError("User not found", 404);
    }

    for (var info in data) {
      if (info == "email") {
        const foundContact = await userRepository.findOne({
          where: {
            email: data.email!,
          },
        });
        if (foundContact) {
          throw new AppError("Email already exists");
        }
      } else if (info == "phone") {
        const foundContact = await userRepository.findOne({
          where: {
            phone: data.phone!,
          },
        });
        if (foundContact) {
          throw new AppError("Phone already exists");
        }
      }
    }

    if (data.password) {
      const hashedPassword = await hash(data.password, 10);
      data.password = hashedPassword;
    }

    const updatedUserData = userRepository.create({
      ...userToUpdate,
      ...data,
      updatedBy: tokenId,
      updatedAt: new Date(),
    });
    await userRepository.save(updatedUserData);
    return userSchemaUpdateResponse.parse(updatedUserData);
  }

  async remove(userId: string): Promise<void> {
    const userRepository = AppDataSource.getRepository(User);
    const userToDelete = await userRepository.findOneBy({
      id: userId,
    });
    if (!userToDelete) {
      throw new AppError("User not found", 404);
    }
    await userRepository.remove(userToDelete);
  }

  async getPdf(userId: string, superUser: boolean) {
    const userRepository = AppDataSource.getRepository(User);

    if (superUser) {
      const users: User[] = await userRepository.find({
        relations: {
          contacts: true,
        },
      });
      const pdfDoc = new jsPDF({ orientation: "p" });
      let x = 0;
      let userCount = 0;
      users.forEach(async (user: User) => {
        if (userCount != 0 && user.contacts.length > 0) {
          pdfDoc.addPage();
        }
        if (user.contacts.length > 0) {
          let count = 0;
          let y = 50;
          userCount = 0;
          pdfDoc.setFontSize(10);
          pdfDoc.setFont("times");
          pdfDoc.setTextColor("#232020");
          pdfDoc.text(`Name: ${user?.name}`, 10, 10);
          pdfDoc.text(`Email: ${user?.email}`, 10, 20);
          pdfDoc.text(`Phone: ${user?.phone}`, 10, 30);
          pdfDoc.text(`Contatos:`, 10, 40);

          user?.contacts.map((contact) => {
            for (const [key, value] of Object.entries(contact)) {
              if (count == 6) {
                pdfDoc.addPage();
                count = -1;
                y = 10;
              }
              if (
                key == "name" ||
                key == "phone" ||
                key == "optionalPhone" ||
                key == "email" ||
                key == "optionalEmail" ||
                key == "status"
              ) {
                pdfDoc.text(`${key}: ${value}`, 30, y);
                y += 5;
                if (key == "status") {
                  y += 10;
                }
              }
            }

            count += 1;
          });
          pdfDoc.addPage();
          x = 0;
        }
        if (userCount > 5) {
          x = 0;
          userCount = 0;
          pdfDoc.addPage();
        }
        pdfDoc.setFontSize(10);
        pdfDoc.setFont("times");
        pdfDoc.setTextColor("#232020");
        pdfDoc.text(`Name: ${user?.name}`, 10, x + 10);
        pdfDoc.text(`Email: ${user?.email}`, 10, x + 20);
        pdfDoc.text(`Phone: ${user?.phone}`, 10, x + 30);
        pdfDoc.text(`Contatos:`, 10, x + 40);
        x = x + 40;
        userCount += 1;
      });
      const pdfBytes = pdfDoc.output("arraybuffer");
      const pdf = new Blob([pdfBytes], { type: "application/pdf" });

      return await pdf.text();
    } else {
      const user: User | null = await userRepository.findOne({
        where: {
          id: userId,
        },
        relations: {
          contacts: true,
        },
      });
      const pdfDoc = new jsPDF({ orientation: "p" });
      let y = 20;
      let count = 0;
      user?.contacts.map((contact) => {
        for (const [key, value] of Object.entries(contact)) {
          if (count == 6) {
            pdfDoc.addPage();
            count = -1;
            y = 20;
          }
          if (
            key == "name" ||
            key == "phone" ||
            key == "optionalPhone" ||
            key == "email" ||
            key == "optionalEmail" ||
            key == "status"
          ) {
            pdfDoc.text(`${key}: ${value}`, 10, y);
            y += 5;
            if (key == "status") {
              y += 10;
            }
          }
        }

        count += 1;
      });
      const pdfBytes = pdfDoc.output("arraybuffer");
      const pdf = new Blob([pdfBytes], { type: "application/pdf" });

      return await pdf.text();
    }
  }

  async getPdfById(userId: string) {
    const userRepository = AppDataSource.getRepository(User);
    let users: User[] = [];
    if (userId) {
      const user = await userRepository.findOne({
        where: {
          id: userId,
        },
        relations: {
          contacts: true,
        },
      });
      if (!user) {
        throw new AppError("User not found", 404);
      }
      users.push(user);
    }

    const pdfDoc = new jsPDF({ orientation: "p" });

    users.forEach(async (user) => {
      pdfDoc.addPage();
      pdfDoc.setFontSize(10);
      pdfDoc.setFont("times");
      pdfDoc.setTextColor("#232020");
      pdfDoc.text(`Name: ${user?.name}`, 10, 10);
      pdfDoc.text(`Email: ${user?.email}`, 10, 20);
      pdfDoc.text(`Phone: ${user?.phone}`, 10, 30);
      pdfDoc.text(`Contatos:`, 10, 40);
      let y = 50;
      let count = 0;
      user?.contacts.map((contact) => {
        for (const [key, value] of Object.entries(contact)) {
          if (count == 6) {
            pdfDoc.addPage();
            count = -1;
            y = 10;
          }
          if (
            key == "name" ||
            key == "phone" ||
            key == "optionalPhone" ||
            key == "email" ||
            key == "optionalEmail" ||
            key == "status"
          ) {
            pdfDoc.text(`${key}: ${value}`, 10, y);
            y += 5;
            if (key == "status") {
              y += 10;
            }
          }
        }

        count += 1;
      });

      // Converte o documento PDF para bytes
    });
    pdfDoc.deletePage(1);
    const pdfBytes = pdfDoc.output("arraybuffer");
    const pdf = new Blob([pdfBytes], { type: "application/pdf" });

    return await pdf.text();
  }

  async getUserByToken(tokenHead: string): Promise<TGetUserByTokenResponse> {
    const [_, token] = tokenHead!.split(" ");
    const decodedToken = verify(token, process.env.SECRET_KEY!) as JwtPayload;
    const userId = decodedToken.id;
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOne({
      where: { id: userId },
      relations: {
        contacts: true,
      },
    });
    if (!userFound) {
      throw new AppError("User not found", 404);
    }
    const user = getUserByTokenResponse.parse(userFound);
    return user;
  }
}
