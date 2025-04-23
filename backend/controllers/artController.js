import { db } from "../config/firebase.js";

export const getAllArt = async (req, res) => {
  try {
    const snapshot = await db.collection("artworks").get();
    const artList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(artList);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch artworks" });
  }
};

export const uploadArt = async (req, res) => {
  try {
    const { title, imageUrl, artist } = req.body;
    const docRef = await db.collection("artworks").add({ title, imageUrl, artist });
    res.json({ id: docRef.id, message: "Artwork uploaded successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload artwork" });
  }
};
