import { db } from "../config/firebase.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = await db.collection("users").add({ email, username, password: hashedPassword });
    res.json({ id: userRef.id, message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const snapshot = await db.collection("users").where("email", "==", email).get();

    if (snapshot.empty) return res.status(400).json({ error: "User not found" });

    const user = snapshot.docs[0].data();
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ email: user.email }, "SECRET_KEY", { expiresIn: "1h" });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};
