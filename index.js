const bcrypt = require("bcryptjs")
let express = require("express");
let path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
const { DATABASE_URL } = process.env;

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getPostGresVersion() {
  const client = await pool.connect()
  try {
    const response = await client.query('SELECT version()')
    console.log(response.rows[0])
  } finally {
    if (client) client.release()
  }
}

getPostGresVersion()

app.post("/login", async (req, res) => {
  const client = await pool.connect()
  const { email, password } = req.body
  try {
    const result = await client.query(`SELECT * FROM users WHERE email=$1 `, [email])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = result.rows[0]

    if (!user) {
      return res.status(400).json({ message: "Incorrect email and password " })
    }

    const matchPass = await bcrypt.compare(password, user.password)
    if (!matchPass) {
      return res.status(401).json({ message: "Incorrect Password" })
    }

    res.json({ Message: "Login Successful" })


  } catch (error) {
    console.error("Error: ", error.message)
    res.status(500).json({ error: error.message })
  } finally {
    if (client) client.release()
  }
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
