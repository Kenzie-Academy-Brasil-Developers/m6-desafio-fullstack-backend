import "reflect-metadata"
import "express-async-errors"
import express from "express";
import { userRouter } from "./routes/user.route";
import { handleAppErrorMiddlieware } from "./middlewares/handleAppError.middleware";
import { sessionRouter } from "./routes/session.route";
import { contactRouter } from "./routes/contact.routes";
import { passwordRouter } from "./routes/password.routes";




const app = express()

app.use(express.json())
app.use("/users", userRouter)
app.use("/login", sessionRouter)
app.use("/contacts", contactRouter)
app.use("/password", passwordRouter)
app.use(handleAppErrorMiddlieware)

export default app