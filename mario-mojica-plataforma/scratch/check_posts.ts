import fs from "fs"
import path from "path"

const envFile = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8")
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=")
  if (k && v.length > 0) {
    process.env[k.trim()] = v.join("=").trim().replace(/^['"]|['"]$/g, "")
  }
})

import { getMarketingPosts, getMarketingCuentas } from "../app/actions/marketing"

async function run() {
  const posts = await getMarketingPosts()
  const cuentas = await getMarketingCuentas()
  console.log("=== POSTS EN BASE DE DATOS ===")
  console.log(JSON.stringify(posts, null, 2))
  console.log("=== CUENTAS EN BASE DE DATOS ===")
  console.log(JSON.stringify(cuentas, null, 2))
}

run()
