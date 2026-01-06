import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"
import path from "node:path"

try {
  const envPath = path.resolve(process.cwd(), ".env")
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8")
    content.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) {
        const [, k, v] = m
        if (!(k in process.env)) {
          process.env[k] = v
        }
      }
    })
  }
} catch {}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing Supabase environment variables")
  console.error(
    JSON.stringify(
      {
        has_SUPABASE_URL: !!process.env.SUPABASE_URL,
        has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const supabase = createClient(url, key)

const dryRun = process.argv.includes("--dry-run")

const randomCategoryId = () => Math.floor(Math.random() * 8) + 3

async function fetchAllIds() {
  let from = 0
  const pageSize = 1000
  const ids = []
  while (true) {
    const { data, error } = await supabase
      .from("characters")
      .select("id", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    ids.push(...data.map(row => row.id))
    if (data.length < pageSize) break
    from += pageSize
  }
  return ids
}

async function updateOne(id) {
  const newVal = randomCategoryId()
  const { error } = await supabase
    .from("characters")
    .update({ category_id: newVal })
    .eq("id", id)
  return { id, newVal, error: error || null }
}

async function run() {
  const ids = await fetchAllIds()
  console.log(`Found ${ids.length} rows.`)
  if (dryRun) {
    console.log("Dry run. No updates performed.")
    return
  }
  const concurrency = 20
  let index = 0
  const results = []
  async function worker() {
    while (index < ids.length) {
      const i = index++
      const id = ids[i]
      const res = await updateOne(id)
      results.push(res)
      if (res.error) console.error(`Failed id=${id}: ${res.error.message || res.error}`)
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, ids.length) }, () => worker())
  await Promise.all(workers)
  const failed = results.filter(r => r.error).length
  console.log(`Updated ${results.length - failed} rows. Failed ${failed}.`)
}

run().catch(err => {
  console.error("Script error:", err)
  process.exit(1)
})

