import fs from "fs"
import path from "path"

const envFile = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8")
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=")
  if (k && v.length > 0) {
    process.env[k.trim()] = v.join("=").trim().replace(/^['"]|['"]$/g, "")
  }
})

import { getMarketingCuentas } from "../app/actions/marketing"

async function run() {
  const { data: cuentas } = await getMarketingCuentas()
  const fb = cuentas?.find((c) => c.plataforma === "facebook")

  if (!fb) {
    console.log("No se encontró cuenta de Facebook.")
    return
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/me/accounts?access_token=${fb.access_token}`
  )
  const json = await res.json()
  console.log("PÁGINAS DE FACEBOOK:", JSON.stringify(json, null, 2))
}

run()
